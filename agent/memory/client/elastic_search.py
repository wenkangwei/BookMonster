from elasticsearch import Elasticsearch

class ES_Client():
    def __init__(self, context):
        conf = context.config['memory']['elastic_search']
        self.es = Elasticsearch(
            hosts=[f"http://{conf.get('host', 'localhost')}:{conf.get('port', 9200)}"],
            basic_auth=(conf.get('username', 'elastic'), conf.get('password', 'changeme')),
            timeout=conf.get('timeout', 5000),
            verify_certs=False
        )
    
    
    def get_doc(self, index, id):
        """
        arguments: 
            index: str
            id: str
        """
        res = self.es.get(index=index, id=id)
        return res["_source"]
    
    def update_doc(self, index, id, data):
        res = self.es.update(index=index, id=id, body={"doc": data})
        return res["_id"]
    
    def batch_create_doc(self, index_name, updates):
        """
        批量更新
        index_name: 
        updates: {doc_id: dictionary_of_content}
        """
        try:
            actions = []
            for doc_id, update_data in updates.items():
                actions.append({
                    "_index": index_name,
                    "_id": doc_id,
                    "doc": update_data
                })
            
            from elasticsearch.helpers import bulk
            ret = bulk(self.es, actions,
                        stats_only=False,  # 获取详细错误信息
                        raise_on_error=False  # 不抛出异常，手动处理错误
                    )
            print("batch_create_doc ret: ",ret)
            return ret
        except Exception as e:
            print("batch_create_doc Exception Error: ", str(e))
        return 
    def delete_doc(self, index, id):
        """
        arguments: 
            index: str
            id: str
        """
        res = self.es.delete(index=index, id=id)    
        return res["_id"]
    
    def search_doc(self, index, query):
        """
        arguments: 
            index: str
            query: json
        returns:
            json: {
                "hits": {
                    "hits": [
                        {
                            "_index": "my_index",
                            "_id": "1",
                            "_score": 1.0,
                            "_source": {
                                "title": "Book 1",
                                "author": "Author 1"
                            }
                        }
                    ]
                }
            }
        """
        res = self.es.search(index=index, body=query)
        return res

    def create_doc(self, index, data, id=''):
        """
        arguments: 
            index: str
            data: json
        """
        if id == '':
            res = self.es.index(index=index, body=data)
            return res["_id"]
        res = self.es.index(index=index, id=id, body=data)
        return res["_id"]
    
    def exists(self, index):
        return self.es.indices.exists(index=index)
    
    def search(self, index, keyword, fields='content',fuzziness = "AUTO"):
        if not isinstance(fields, list):
            fields = list(fields)
        query = {
                "query": {
                    "multi_match": {
                        "query": keyword,
                        "fields": fields,
                        "fuzziness": fuzziness,
                        "type": "best_fields",
                        "operator": "or"
                    }
                }
            }

        return self.search_doc(index, query)
    

    
    def get_all_index_values(self):
        """
        获取所有文档的 _index 值（去重）
        """
        try:
            all_indices = set()
            
            # 使用 Scroll API 遍历所有文档
            query_body = {
                "size": 1000,
                "query": {"match_all": {}},
                "_source": False  # 不返回源文档内容，提高性能
            }
            
            # 开始 scroll
            response = self.es.search(
                index="*",  # 搜索所有索引
                body=query_body,
                scroll='2m'
            )
            
            scroll_id = response['_scroll_id']
            hits = response['hits']['hits']
            print("hits[0]=", hits[0])
            # 处理第一批结果
            while hits:
                for hit in hits:
                    all_indices.add(hit['_index'])
                
                # 获取下一批结果
                response = self.es.scroll(
                    scroll_id=scroll_id,
                    scroll='2m'
                )
                
                scroll_id = response['_scroll_id']
                hits = response['hits']['hits']
            
            # 清理 scroll 上下文
            if scroll_id:
                self.es.clear_scroll(scroll_id=scroll_id)
            
            return sorted(list(all_indices))
            
        except Exception as e:
            print(f"获取所有 _index 值错误: {e}")
            return []
        
    
    def _get_all_documents_scroll(self, index_name, fields=None, batch_size=1000):
        """
        使用 Scroll API 获取所有文档（最稳定的方法）
        """
        all_documents = []
        scroll_id = None
        
        try:
            # 初始查询
            query_body = {
                "size": batch_size,
                "query": {"match_all": {}}
            }
            
            if fields:
                query_body["_source"] = fields
            
            # 开始 scroll
            response = self.es.search(
                index=index_name,
                body=query_body,
                scroll='5m'  # 保持5分钟
            )
            
            scroll_id = response['_scroll_id']
            hits = response['hits']['hits']
            
            # 处理所有批次
            batch_count = 0
            while hits:
                all_documents.extend(hits)
                batch_count += 1
                
                if batch_count % 10 == 0:
                    print(f"已处理 {batch_count} 批，共 {len(all_documents)} 个文档")
                
                # 获取下一批
                response = self.es.scroll(
                    scroll_id=scroll_id,
                    scroll='5m'
                )
                
                scroll_id = response['_scroll_id']
                hits = response['hits']['hits']
            
            print(f"从索引 {index_name} 中获取了 {len(all_documents)} 个文档")
            print("all_documents[0]: ", all_documents[0])
            return all_documents #self._parse_documents(all_documents)
            
        except Exception as e:
            print(f"Scroll API 错误: {e}")
            return []
        
        finally:
            # 清理 scroll 上下文
            if scroll_id:
                try:
                    self.es.clear_scroll(scroll_id=scroll_id)
                except:
                    pass

    def get_all_documents_search_after(self, index_name, fields=None, batch_size=1000):
        """
        使用 Search After 获取所有文档
        """
        try:
            all_documents = []
            sort_field = "_id"  # 使用 _id 作为排序字段
            
            query_body = {
                "size": batch_size,
                "query": {"match_all": {}},
                "sort": [{sort_field: "asc"}]
            }
            
            if fields:
                query_body["_source"] = fields
            
            response = self.es.search(index=index_name, body=query_body)
            hits = response['hits']['hits']
            
            while hits:
                all_documents.extend(hits)
                
                # 获取最后一个文档的排序值
                last_sort_value = hits[-1]['sort'][0] if hits[-1].get('sort') else hits[-1]['_id']
                
                # 下一批查询
                query_body["search_after"] = [last_sort_value]
                response = self.es.search(index=index_name, body=query_body)
                hits = response['hits']['hits']
            
            print(f"从索引 {index_name} 中获取了 {len(all_documents)} 个文档")
            return self._parse_hits_from_response(all_documents)
            
        except Exception as e:
            print(f"Search After 错误: {e}")
            return []