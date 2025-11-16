import os
import re
import json
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Union, Optional

from google import genai  # from google-genai package
from db_utils import get_database_schema_with_descriptions

load_dotenv()

api_key = os.getenv("API_KEY")
if not api_key:
    raise RuntimeError("API_KEY not found in .env")

# Create Gemini client
client = genai.Client(api_key=api_key)

class SuggestedChart(BaseModel):
    type: str
    x: str
    y: str  # Must be a single string column name (no arrays/multi-series)
    title: str
    
class Query(BaseModel):
    name: str
    sql: str
    suggested_chart: SuggestedChart

class QueryResponse(BaseModel):
    queries: List[Query]
    error: Optional[str] = None


def clean_json_block(text: str) -> str:
    text = text.strip()

    # If it's wrapped in ```...``` fences, strip them
    if text.startswith("```"):
        # remove leading and trailing ```
        text = text.strip("`").strip()
        # if there's a language label like "json", remove first line
        if text.lower().startswith("json"):
            text = text.split("\n", 1)[1].strip()

    # As a fallback, extract the first {...} block
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return match.group(0).strip()
    return text



class GeminiSQLWrapper:
    """Wrapper for Gemini to generate SQL queries with chart metadata"""
    
    def __init__(self, api_key: str = None, model: str = "gemini-2.0-flash-lite"):
        self.api_key = api_key or os.getenv("API_KEY")
        if not self.api_key:
            raise ValueError("API key required")
        
        self.client = genai.Client(api_key=self.api_key)
        self.model = model
        self.input_schema = None
    
    def set_input_schema(self, schema: List[dict]):
        """Set the database schema for context"""
        schema_str = "DATABASE SCHEMA:\n\n"
        for table in schema:
            schema_str += f"Table: {table['table']}\n"
            if table.get('description'):
                schema_str += f"Description: {table['description']}\n"
            schema_str += "Columns:\n"
            for col in table['columns']:
                schema_str += f"  - {col['name']} ({col['type']})"
                if col.get('description'):
                    schema_str += f": {col['description']}"
                schema_str += "\n"
            schema_str += "\n"
        
        self.input_schema = schema_str
    
    def load_schema_from_db(self, db_path: str = "codejam_15.db"):
        """Load schema directly from database"""
        schema = get_database_schema_with_descriptions(db_path)
        self.set_input_schema(schema)
        self.raw_schema = schema  # Store raw schema for inspection
    
    def get_schema_info(self):
        """Get information about the loaded schema"""
        if not hasattr(self, 'raw_schema') or not self.raw_schema:
            return None
        return {
            "table_count": len(self.raw_schema),
            "tables": [table["table"] for table in self.raw_schema],
            "full_schema": self.raw_schema
        }
    
    def query(self, user_input: str) -> QueryResponse:
        """Generate SQL query and chart metadata from natural language"""
        
        if not self.input_schema:
            raise ValueError("Schema must be set before querying. Call set_schema() first.")
        
        prompt = f"""You are a SQL query generator and data visualization assistant.

        {self.input_schema}

        USER REQUEST: "{user_input}"

        Generate SQL queries and chart metadata based on the user's request.

        Return ONLY a JSON object with this EXACT structure:
        {{
        "queries": [
            {{
            "name": "descriptive_name_snake_case",
            "sql": "SELECT * FROM table_name WHERE condition ORDER BY column_name;",
            "suggested_chart": {{
                "type": "line" OR "bar" ONLY,
                "x": "column_name_for_x_axis",
                "y": "column_name_for_y_axis",
                "title": "Descriptive Chart Title"
            }}
            }}
        ]
        }}

        OR if the request is out of scope or cannot be visualized:

        {{
        "error": "The request is out of scope. Please ask questions about the database tables: customers, products, orders, departments, payroll, expenses, or daily_revenue. \nOnly simple line or bar charts are supported."
        }}

        Rules:
        - Only use tables and columns from the schema
        - Generate valid SQL with proper syntax
        - Chart type MUST be "line" (for time series) or "bar" (for categories) ONLY
        - Use DuckDB syntax for the SQL query
        - CRITICAL: Always use SELECT * FROM table (not SELECT specific columns)
        - If the user requests aggregated data (sums, counts, etc.), select as many columns as possible
        - When comparing time data, make sure the types are compatible
        - x,y field MUST be a single string column name, NEVER an array
        - If user asks about unrelated topics, return error JSON
        - Include semicolon at end of SQL
        - Use descriptive snake_case names
        - No markdown, no explanation, just raw JSON

        CRITICAL: Return ONLY the JSON object, nothing else.
        """

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
        )
        
        raw = clean_json_block(response.text.strip())
        
        try:
            parsed = json.loads(raw)
            
            # Check if it's an error response
            if 'error' in parsed and parsed.get('error'):
                return QueryResponse(queries=[], error=parsed['error'])
            
            return QueryResponse.model_validate_json(raw)
        except Exception as e:
            print(f"Failed to parse response: {raw}")
            raise ValueError(f"Failed to parse Gemini response: {e}")
    

    def generate_insights(self, insights_data: dict, sql_query: str = None) -> str:
        """Generate natural language insights from structured insights data"""
        
        # Format the insights data for the prompt
        insights_summary = {
            "overview": insights_data.get("overview", {}),
            "column_count": len(insights_data.get("columns", [])),
            "numeric_columns": [col["name"] for col in insights_data.get("columns", []) if col.get("stats")],
            "correlations_count": len(insights_data.get("correlations", [])),
            "strong_correlations": insights_data.get("correlations", [])[:5],  # Top 5
            "columns_with_stats": [
                {
                    "name": col["name"],
                    "type": col["type"],
                    "missing": col.get("missing", 0),
                    "missing_percent": col.get("missing_percent", 0),
                    "stats": col.get("stats")
                }
                for col in insights_data.get("columns", [])
                if col.get("stats")
            ]
        }
        
        prompt = f"""You are a data analyst providing insights from a dataset analysis.

SQL QUERY ANALYZED: {sql_query or "N/A"}

DATASET OVERVIEW:
- Total Rows: {insights_summary['overview'].get('row_count', 0):,}
- Total Columns: {insights_summary['overview'].get('column_count', 0)}
- Memory Usage: {insights_summary['overview'].get('memory_usage', 0):.2f} MB
- Duplicate Rows: {insights_summary['overview'].get('duplicate_rows', 0)}

NUMERIC COLUMNS ANALYZED: {len(insights_summary['numeric_columns'])}
{', '.join(insights_summary['numeric_columns']) if insights_summary['numeric_columns'] else 'None'}

COLUMN STATISTICS:
"""
        
        for col in insights_summary['columns_with_stats'][:5]:  # Top 5 columns
            stats = col.get('stats', {})
            
            # Format numeric values safely
            def format_stat(value):
                if value is None or not isinstance(value, (int, float)):
                    return 'N/A'
                return f"{value:,.2f}"
            
            mean_val = format_stat(stats.get('mean'))
            median_val = format_stat(stats.get('median'))
            std_val = format_stat(stats.get('std'))
            min_val = format_stat(stats.get('min'))
            max_val = format_stat(stats.get('max'))
            
            prompt += f"""
- {col['name']} ({col['type']}):
  * Missing Values: {col.get('missing', 0)} ({col.get('missing_percent', 0):.1f}%)
  * Mean: {mean_val}
  * Median: {median_val}
  * Std Dev: {std_val}
  * Range: {min_val} to {max_val}
"""
        
        if insights_summary['strong_correlations']:
            prompt += f"""
CORRELATIONS FOUND: {insights_summary['correlations_count']} correlation pairs
Top Correlations:
"""
            for corr in insights_summary['strong_correlations'][:3]:
                prompt += f"- {corr.get('col1', '')} ↔ {corr.get('col2', '')}: {corr.get('correlation', 0):.3f}\n"
        
        prompt += """
TASK: Generate exactly 3 insights. Focus on HIDDEN relationships and patterns not visible to the naked eye.

INSIGHT 1 - HIDDEN RELATIONSHIPS:
Analyze correlations between columns. Identify non-obvious relationships that require statistical analysis to detect.
- Look at correlation values: which columns move together? Why might that be?
- Compare mean vs median: large gaps indicate skew or outliers
- Check if correlated columns share underlying drivers
- Example: "Total revenue and quantity have 0.82 correlation, meaning volume drives 67% of revenue variance"

INSIGHT 2 - HIDDEN PATTERNS OR OUTLIERS:
Identify statistical patterns that aren't immediately visible.
- Large std dev relative to mean indicates high variability - why?
- Min/max values far from median suggest outliers - what do they represent?
- If no outliers: identify distribution patterns (skew, clusters) or second correlation
- Example: "Std dev is 60% of mean, indicating wide variation - investigate what drives the high vs low performers"

INSIGHT 3 - ACTIONABLE NEXT STEP:
Based on the hidden patterns found, what specific investigation or action should happen next?
- Be specific: which columns to analyze together? What hypothesis to test?
- Not generic advice, but a concrete next analytical step
- Example: "Investigate if high-quantity orders correlate with specific time periods or customer segments"

FORMAT:
Write exactly 3 insights, each starting with "INSIGHT 1:", "INSIGHT 2:", "INSIGHT 3:"
Each insight is ONE sentence. Be direct, statistical, and practical. Focus on relationships and patterns that require analysis to see.
No markdown, no wordy explanations, just the insight.
"""
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
            )
            
            nl_insights = response.text.strip()
            return nl_insights
        except Exception as e:
            return f"Error generating insights: {str(e)}"



if __name__ == "__main__":
    # Initialize wrapper
    wrapper = GeminiSQLWrapper()
    
    # Load schema from database (automatically includes descriptions)
    print("Loading schema from database...")
    wrapper.load_schema_from_db()
    
    # Verify schema was loaded
    schema_info = wrapper.get_schema_info()
    if schema_info:
        print(f"\n✓ Schema loaded successfully!")
        print(f"  Tables found: {schema_info['table_count']}")
        print(f"  Table names: {', '.join(schema_info['tables'])}")
        print("\n" + "=" * 70)
        print("Schema preview (first table):")
        if schema_info['tables']:
            first_table = next(t for t in schema_info['full_schema'] if t['table'] == schema_info['tables'][0])
            print(json.dumps(first_table, indent=2))
    else:
        print("⚠ Warning: Schema not loaded!")
    
    print("\n" + "=" * 70)
    # Test query
    print("Testing query: 'Compare monthly revenue and monthly tax collected for 2024'")
    print("=" * 70)
    
    result = wrapper.query("Compare monthly revenue and monthly tax collected for 2024")
    
    # Print results
    print(json.dumps(result.model_dump(), indent=2))
    
    print("\n" + "=" * 70)
    print("Accessing individual fields:")
    print(f"Query name: {result.queries[0].name}")
    print(f"SQL: {result.queries[0].sql}")
    print(f"Chart type: {result.queries[0].suggested_chart.type}")
    print(f"Chart title: {result.queries[0].suggested_chart.title}")