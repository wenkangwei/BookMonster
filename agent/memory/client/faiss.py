import os
import numpy as np
import faiss
import json



class Faiss_Client():
    def __init__(self, context):
        conf = context.config['memory']['faiss']
        print("Faiss conf: ", conf)
        self.data_root = conf.get('data_root', './data')
        dict_file = conf.get('dict_file', 'faiss_dict.json')
        self.index_name = conf.get("index_name", "faiss_index.bin")
        self.dict_file = os.path.join(self.data_root, dict_file)
        self.index_path = os.path.join(self.data_root, self.index_name)
        self.dim = conf.get('dimension', 768)
        # self.index.nprobe = conf.get('nprobe', 10)
        self.embeddings = None
        self.ids = {}
        self.id2idx = {}
        if not os.path.exists(self.data_root):
            os.makedirs(self.data_root)
        if not os.path.exists(self.index_path) or not os.path.exists(self.dict_file):
            self.index = faiss.IndexFlatL2(self.dim)
        else:
            self.index, self.embeddings,self.dim,  self.ids, self.id2idx = self.load_index(self.index_path, self.dict_file)

            
    def load_index(self, index_path, dict_path):
        index = faiss.read_index(index_path)
        print("faiss index loaded")
        print("FAISS 索引信息:")
        print(f"- 向量数量 (ntotal): {index.ntotal}")  # 索引中的向量总数
        print(f"- 向量维度 (d): {index.d}")           # 每个向量的维度
        print(f"- 是否已训练 (is_trained): {index.is_trained}")  # 索引是否已训练（如 IVF 需要训练）
        print(f"- 度量方式 (metric_type): {index.metric_type}")  # 0
        embeddings = index.reconstruct_n(0, index.ntotal)
        dim = index.d

        with open(dict_path,"r") as fp:
            id2idx = json.load(fp)
        ids = {v:k for k, v in id2idx.items()}
        return index, embeddings, dim, ids, id2idx

    def remove_index(self, id):
        idx = self.id2idx.get(id,'')
        if idx!='':
            self.ids.pop(idx)
            self.id2idx.pop(id)
        self.index.remove_ids(np.array([id]))
        return

    def insert_vector(self, vectors, merge_index=False):
        embeddings = vectors['embeddings']
        ids = vectors['ids']
        if len(ids) != len(embeddings):
            print("len(ids) = ", len(ids), "len(embeddings)= ", len(embeddings), "are not equal")
            return False
        
        embs = np.array(embeddings, dtype='float32')
        print("emb shape: ", embs.shape)
        # if not self.index.is_trained:
        #     self.index.train(embs)  # 对于某些索引类型需要训练
        if merge_index:
            return self.rebuild_index_with_new_vectors(embs, ids)
        else:
            # delete old index and create new one
            try:
                if os.path.exists(self.index_path):
                    os.remove(self.index_path)
                    print(f"索引文件已删除: {self.index_path}")
                if os.path.exists(self.dict_file):
                    os.remove(self.dict_file)
                    print(f"索引文件已删除: {self.dict_file}")
                self.create_new_index()
                if not self.index.is_trained:
                    self.index.train(embs)
                print("embs trained")
                self.index.add(embs)
                print("emb added")
                self.embeddings = embs
                self.ids = {i: id for i, id in enumerate(vectors['ids'])}
                self.id2idx = {id: i for i, id in enumerate(vectors['ids'])}
            except Exception as e:
                print("insert_vector Error: ", str(e))
                return False
            
        return  True

    def search_vector(self, query_vec, topK=10):
        query_vec = np.array(query_vec, dtype='float32').reshape(1, -1)
        distances, indices = self.index.search(query_vec, topK)
        ids = [self.ids[ int(i)] for i in indices[0] if int(i) in self.ids]
        return ids, distances[0].tolist()
    
    def save_index(self,):
        # save embeddings
        faiss.write_index(self.index, self.index_path)
        ##save dict conf
        import json
        with open(self.dict_file, "w") as fp:
            json.dump(self.id2idx, fp)
        return os.path.exists(self.index_path)

    def create_new_index(self) -> bool:
        """创建新索引"""
        if not self.dim:
            print("需要指定维度")
            return False
        
        try:
            self.index = faiss.IndexFlatL2(self.dim)
            print(f"新索引创建成功，维度: {self.dim}")
            return True
        except Exception as e:
            print(f"创建索引失败: {e}")
            return False


    def rebuild_index_with_new_vectors(self, new_embs, new_ids ,save_path=None):
        """在原来的emb里面新增新向量的索引"""
        try:
            # 获取原有向量
            original_embs = self.get_all_vectors()
            # update index
            origin_idex = list(self.id2idx.keys())
            print("origin_index: ", origin_idex[:10])
            for i, v in enumerate(origin_idex + new_ids):
                self.id2idx[i] = v
            self.ids = {v:k for k, v in self.id2idx.items()}

            if original_embs is not None:
                # 合并向量
                all_embs = np.vstack([original_embs, new_embs])
            else:
                all_embs = new_embs
            
            # 创建新索引
            self.index = self.create_new_index(all_embs)
            
            print(f"重建索引成功，总向量数量: {self.index.ntotal}")
            
            # 保存新索引
            if save_path:
                self.save_index(save_path)
            return True
            
        except Exception as e:
            print(f"重建索引失败: {e}")
            return False
    
    def get_all_vectors(self):
        """获取索引中的所有向量"""
        if self.index is None or self.index.ntotal == 0:
            return None
        
        try:
            # 尝试使用 reconstruct 方法获取向量
            vectors = []
            for i in range(self.index.ntotal):
                try:
                    vec = self.index.reconstruct(i)
                    vectors.append(vec)
                except:
                    break
            
            if vectors:
                return np.array(vectors).astype('float32')
            return None
            
        except:
            return None