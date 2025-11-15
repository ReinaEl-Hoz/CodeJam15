from flask import Blueprint, request, jsonify
from queries import QUERY_FUNCTIONS

api = Blueprint('api', __name__)

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