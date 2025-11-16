from fastapi.responses import JSONResponse
from flask import Blueprint, request, jsonify
from key_insights import get_key_insights
from queries import QUERY_FUNCTIONS
from chat import GeminiSQLWrapper
from db_utils import get_connection
import json

api = Blueprint('api', __name__)

# Initialize GeminiSQLWrapper once (singleton pattern)
_wrapper = None

def get_wrapper():
    """Get or create the GeminiSQLWrapper instance"""
    global _wrapper
    if _wrapper is None:
        _wrapper = GeminiSQLWrapper()
        _wrapper.load_schema_from_db()
        print("GeminiSQLWrapper initialized and schema loaded")
    return _wrapper

@api.route('/query-data', methods=['POST'])
def query_data():
    """
    Main endpoint for querying data
    Expected JSON body:
    {
        "query_type": "daily_revenue" | "revenue_by_product" | etc.,
        "filters": {
            "start_date": "2023-01-01",
            "end_date": "2023-12-31",
            "top_n": 10
        }
    }
    """
    try:
        data = request.get_json()
        query_type = data.get('query_type')
        filters = data.get('filters', {})
        
        if not query_type:
            return jsonify({
                'success': False,
                'error': 'query_type is required'
            }), 400
        
        if query_type not in QUERY_FUNCTIONS:
            return jsonify({
                'success': False,
                'error': f'Unknown query_type: {query_type}',
                'available_types': list(QUERY_FUNCTIONS.keys())
            }), 400
        
        # Get the appropriate query function
        query_func = QUERY_FUNCTIONS[query_type]
        
        # Call function with filters (if it accepts them)
        import inspect
        sig = inspect.signature(query_func)
        
        if len(sig.parameters) > 0:
            # Function accepts parameters, pass relevant filters
            result = query_func(**{k: v for k, v in filters.items() if k in sig.parameters})
        else:
            # Function doesn't accept parameters
            result = query_func()
        
        return jsonify({
            'success': True,
            'data': result,
            'query_type': query_type
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api.route('/available-queries', methods=['GET'])
def available_queries():
    """Get list of available query types"""
    return jsonify({
        'success': True,
        'queries': list(QUERY_FUNCTIONS.keys())
    })

@api.route('/test-db', methods=['GET'])
def test_db():
    """Test database connection"""
    try:
        from db import execute_query
        result = execute_query("SELECT COUNT(*) as count FROM orders")
        return jsonify({
            'success': True,
            'message': 'Database connection successful',
            'order_count': result[0]['count']
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@api.route('/chat', methods=['POST'])
def chat():
    """
    Chat endpoint that uses Gemini to generate SQL queries
    Expected JSON body:
    {
        "user_input": "Show me total revenue by month for 2024"
    }
    """
    try:
        data = request.get_json()
        user_input = data.get('user_input')
        
        if not user_input:
            return jsonify({
                'success': False,
                'error': 'user_input is required'
            }), 400
        
        # Get wrapper and process query
        wrapper = get_wrapper()
        
        # Print to terminal
        print("\n" + "=" * 70)
        print(f"User Query: {user_input}")
        print("=" * 70)
        
        result = wrapper.query(user_input)
        
        # Print query results to terminal
        print("\nGenerated Query Response:")
        print(json.dumps(result.model_dump(), indent=2))
        print("=" * 70 + "\n")
        
        # Check for error response from AI
        if result.error:
            print(f"\n⚠️  AI Error: {result.error}\n")
            return jsonify({
                'success': False,
                'error': result.error
            }), 400
        
        # Validate chart types and y field
        for q in result.queries:
            # Check chart type
            if q.suggested_chart.type not in ['line', 'bar']:
                error_msg = f"Unsupported chart type: {q.suggested_chart.type}. Only 'line' and 'bar' charts are supported."
                print(f"\n⚠️  Validation Error: {error_msg}\n")
                return jsonify({
                    'success': False,
                    'error': error_msg
                }), 400
            
            # Check if y is an array (multi-series not allowed)
            if isinstance(q.suggested_chart.y, list):
                error_msg = "Multi-series charts are not supported. Please request a single metric to visualize."
                print(f"\n⚠️  Validation Error: {error_msg}\n")
                return jsonify({
                    'success': False,
                    'error': error_msg
                }), 400
        
        # Helper function to transform data to Plotly format
        def transform_to_plotly(data, x_key, y_key, chart_type, title):
            """Transform query data to Plotly format"""
            if not data or len(data) == 0:
                return None
            
            x_values = []
            y_values = []
            
            for row in data:
                # Try to find the x and y values in the row (case-insensitive)
                x_value = None
                y_value = None
                
                # Try exact match first
                if x_key in row:
                    x_value = row[x_key]
                elif x_key.lower() in {k.lower(): k for k in row.keys()}:
                    x_value = row[{k.lower(): k for k in row.keys()}[x_key.lower()]]
                
                if y_key in row:
                    y_value = row[y_key]
                elif y_key.lower() in {k.lower(): k for k in row.keys()}:
                    y_value = row[{k.lower(): k for k in row.keys()}[y_key.lower()]]
                
                # Fallback to first/second column if keys not found
                if x_value is None and len(row) > 0:
                    x_value = list(row.values())[0]
                if y_value is None and len(row) > 1:
                    y_value = list(row.values())[1]
                
                if x_value is not None and y_value is not None:
                    x_values.append(x_value)
                    try:
                        y_values.append(float(y_value))
                    except (ValueError, TypeError):
                        y_values.append(0)
            
            if len(x_values) == 0 or len(y_values) == 0:
                return None
            
            plotly_obj = {
                'x': x_values,
                'y': y_values,
                'type': 'scatter' if chart_type == 'line' else 'bar',
                'name': title
            }
            
            # Only add mode for line charts
            if chart_type == 'line':
                plotly_obj['mode'] = 'lines'
            
            return plotly_obj
        
        # Execute SQL queries and get data
        queries_with_data = []
        for q in result.queries:
            try:
                # Execute the SQL query
                con = get_connection()
                
                # Execute query and get result
                db_result = con.execute(q.sql)
                query_result = db_result.fetchall()
                
                # Get column names from DuckDB result
                # DuckDB result has .columns attribute
                try:
                    columns = db_result.columns if hasattr(db_result, 'columns') else []
                except:
                    columns = []
                
                # If columns not available, try to get from DataFrame
                if not columns:
                    try:
                        df = con.execute(q.sql).df()
                        columns = df.columns.tolist()
                        query_result = df.to_dict('records')
                    except:
                        pass
                
                # Convert to list of dicts
                data = []
                if columns and query_result:
                    if isinstance(query_result[0], dict):
                        # Already in dict format (from DataFrame)
                        data = query_result
                    else:
                        # Convert tuple rows to dicts
                        for row in query_result:
                            data.append(dict(zip(columns, row)))
                elif query_result:
                    # Fallback: use generic column names
                    if isinstance(query_result[0], dict):
                        data = query_result
                    else:
                        columns = [f"col_{i}" for i in range(len(query_result[0]))]
                        for row in query_result:
                            data.append(dict(zip(columns, row)))
                
                con.close()
                
                # Print data to terminal
                print(f"\nQuery '{q.name}' executed successfully:")
                print(f"  Rows returned: {len(data)}")
                if data:
                    print(f"  Sample row: {data[0]}")
                
                # Transform to Plotly format
                plotly_data = None
                if data and isinstance(q.suggested_chart.y, str):  # Only single y-axis supported
                    plotly_data = transform_to_plotly(
                        data,
                        q.suggested_chart.x,
                        q.suggested_chart.y,
                        q.suggested_chart.type,
                        q.suggested_chart.title
                    )
                
                queries_with_data.append({
                    'name': q.name,
                    'sql': q.sql,
                    'data': data,  # Keep raw data for reference
                    'plotly_data': plotly_data,  # Add Plotly-ready data
                    'suggested_chart': {
                        'type': q.suggested_chart.type,
                        'x': q.suggested_chart.x,
                        'y': q.suggested_chart.y,
                        'title': q.suggested_chart.title
                    }
                })
            except Exception as e:
                error_msg = f"Error executing query '{q.name}': {str(e)}"
                print(f"\n{error_msg}\n")
                queries_with_data.append({
                    'name': q.name,
                    'sql': q.sql,
                    'data': [],
                    'plotly_data': None,
                    'error': error_msg,
                    'suggested_chart': {
                        'type': q.suggested_chart.type,
                        'x': q.suggested_chart.x,
                        'y': q.suggested_chart.y,
                        'title': q.suggested_chart.title
                    }
                })
        
        # Return response to frontend
        return jsonify({
            'success': True,
            'queries': queries_with_data
        })
        
    except Exception as e:
        error_msg = str(e)
        print(f"\nError processing query: {error_msg}\n")
        return jsonify({
            'success': False,
            'error': error_msg
        }), 500
    
@api.route('/key-insights', methods=['GET'])
def profile_report():
    try:
        # Get query from query parameter
        query = request.args.get('query')
        
        if not query:
            return jsonify({
                'success': False,
                'error': 'query parameter is required'
            }), 400
        
        # Call get_key_insights with the query
        insights = get_key_insights(query)
        
        return jsonify({
            'success': True,
            'data': insights
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == "__main__":
    print(get_key_insights("SELECT date, total_revenue FROM daily_revenue ORDER BY date"))