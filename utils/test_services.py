def test_milvus_connection():
    from pymilvus import connections, utility
    try:
        connections.connect(
            alias="default",
            host="my_milvus",
            port="19530"
        )
        collections = utility.list_collections()
        print(f"✅ Milvus connected. Collections: {collections}")
        return True
    except Exception as e:
        print(f"❌ Milvus connection failed: {str(e)}")
        return False
    finally:
        if connections.has_connection("default"):
            connections.disconnect("default")

def test_mysql_connection():
    import mysql.connector
    try:
        db = mysql.connector.connect(
            host="my_mysql",
            user="root",
            password="your_password"
        )
        cursor = db.cursor()
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()[0]
        print(f"✅ MySQL connected. Version: {version}")
        return True
    except Exception as e:
        print(f"❌ MySQL connection failed: {str(e)}")
        return False
    finally:
        if 'db' in locals() and db.is_connected():
            db.close()

def test_elasticsearch_connection():
    from elasticsearch import Elasticsearch
    try:
        es = Elasticsearch(
            hosts=["http://my_elasticsearch:9200"],
            basic_auth=('elastic', 'your_password')
        )
        info = es.info()
        print(f"✅ Elasticsearch connected. Cluster name: {info['cluster_name']}")
        return True
    except Exception as e:
        print(f"❌ Elasticsearch connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("Testing service connections...")
    services_ok = all([
        test_milvus_connection(),
        test_mysql_connection(),
        test_elasticsearch_connection()
    ])
    
    if services_ok:
        print("🎉 All services connected successfully!")
    else:
        print("⚠️ Some services failed to connect")