from sqlalchemy import text

from backend.database.database import engine


def get_columns(connection, table_name: str):
    result = connection.execute(
        text(f"PRAGMA table_info({table_name})")
    )

    return {
        row[1]
        for row in result.fetchall()
    }


def add_column_if_missing(
    connection,
    table_name: str,
    column_name: str,
    column_definition: str,
):
    columns = get_columns(
        connection,
        table_name,
    )

    if column_name in columns:
        print(
            f"EXISTS: {table_name}.{column_name}"
        )
        return

    connection.execute(
        text(
            f"""
            ALTER TABLE {table_name}
            ADD COLUMN {column_name}
            {column_definition}
            """
        )
    )

    print(
        f"ADDED: {table_name}.{column_name}"
    )


def migrate():
    print()
    print("========================================")
    print("CLIPFORGE CREDIT MIGRATION")
    print("========================================")
    print()

    with engine.begin() as connection:

        # ========================================================
        # USERS
        # ========================================================

        add_column_if_missing(
            connection,
            "users",
            "ai_credits",
            "INTEGER NOT NULL DEFAULT 30",
        )

        add_column_if_missing(
            connection,
            "users",
            "credits_reset_at",
            "DATETIME",
        )

        add_column_if_missing(
            connection,
            "users",
            "created_at",
            "DATETIME",
        )

        add_column_if_missing(
            connection,
            "users",
            "updated_at",
            "DATETIME",
        )

    print()
    print("========================================")
    print("MIGRATION COMPLETED")
    print("========================================")


if __name__ == "__main__":
    migrate()