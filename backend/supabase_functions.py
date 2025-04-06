import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path=".env")


def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    print(f"util URL: {url}")
    print(f"util KEY: {key}")
    supabase: Client = create_client(url, key)
    return supabase


# Initialize the Supabase client
supabase: Client = get_supabase_client()


def get_table_schema(table_name):
    query = f"""
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = '{table_name}';
    """
    response = supabase.rpc("sql", {"query": query})
    return response.data


def document_schema(schema_data, table_name):
    doc_lines = [f"### Table: `{table_name}`\n"]
    doc_lines.append("| Column | Type | Nullable |")
    doc_lines.append("|--------|------|----------|")

    for column in schema_data:
        doc_lines.append(
            f"| {column['column_name']} | {column['data_type']} | {column['is_nullable']} |"
        )

    return "\n".join(doc_lines)


def insert_to_supabase(table_name, data: dict):
    response = supabase.table(table_name).insert(data).execute()
    return response


def select_all_from_supabase(table_name):
    """Select all data from a table"""
    response = supabase.table(table_name).select("*").execute()
    return response.data


def filter_from_supabase(table_name, column_name, value):
    """Select data from Supabase"""
    response = supabase.table(table_name).select("*").eq(column_name, value).execute()
    return response.data


def delete_from_supabase(table_name, column_name, value):
    """Delete data from Supabase"""
    response = supabase.table(table_name).delete().eq(column_name, value).execute()
    return response


if __name__ == "__main__":
    # Example usage
    table_name = "listings"
    # data = {
    #     "essay_body": "test",
    #     "grading": "{}"
    # }
    # insert_response = insert_to_supabase(table_name, data)
    # print(f"Insert response: {insert_response}")

    select_response = select_all_from_supabase(table_name)
    print(f"Select response: {select_response}")

    # filter_response = filter_from_supabase(table_name, 'id', '1')
    # print(f"Filter response: {filter_response}")
