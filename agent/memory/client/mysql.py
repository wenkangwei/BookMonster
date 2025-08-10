# from flask import Flask, request, jsonify
import mysql.connector


class MySQL_Client:
    def __init__(self, context):
        self.host = context.config['memory'].get("mysql",{}).get("host","localhost")
        self.user = context.config['memory'].get("mysql",{}).get("user","root")
        self.password = context.config['memory'].get("mysql",{}).get("password","123456")
        self.database = context.config['memory'].get("mysql",{}).get("database","test")
        self.port = context.config['memory'].get("mysql",{}).get("port",3306)
        self.db = mysql.connector.connect(
            host=self.host,
            user=self.user,
            password=self.password,
            database=self.database,
            port=self.port
        )
        print("mysql client connected")
        self.cursor = self.db.cursor()

    def create_table(self, table_name, columns):
        columns_str = ', '.join([f"{col} {dtype}" for col, dtype in columns.items()])
        query = f"CREATE TABLE IF NOT EXISTS {table_name} ({columns_str})"
        self.cursor.execute(query)
        self.db.commit()
    
    def create_record(self, table_name, data):
        # 支持批量insert
        if isinstance(data, list):
            columns = ', '.join(data[0].keys())
            placeholders = ', '.join(['%s'] * len(data[0]))
            query = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
            self.cursor.executemany(query, [list(d.values()) for d in data])
        else:
            columns = ', '.join(data.keys())
            placeholders = ', '.join(['%s'] * len(data))
            query = f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})"
            self.cursor.execute(query, list(data.values()))
        self.db.commit()
        return self.cursor.lastrowid
    
    def query_record(self, table_name, condition):
        query = f"SELECT * FROM {table_name} WHERE {condition}"
        self.cursor.execute(query)
        return self.cursor.fetchall()
    def sql(self,query):
        self.cursor.execute(query)
        return self.cursor.fetchall()
    def update_record(self, table_name, data, condition):
        set_clause = ', '.join([f"{col} = %s" for col in data.keys()])
        query = f"UPDATE {table_name} SET {set_clause} WHERE {condition}"
        self.cursor.execute(query, list(data.values()))
        self.db.commit()
        return self.cursor.rowcount
    
    def delete_record(self, table_name, condition):
        query = f"DELETE FROM {table_name} WHERE {condition}"
        self.cursor.execute(query)
        self.db.commit()
        return self.cursor.rowcount
    
    def close(self):
        self.cursor.close()
        self.db.close()