from huggingface_hub import snapshot_download
import os
# 下载整个模型仓库
snapshot_download(
    repo_id="black-forest-labs/FLUX.1-dev",
    token= os.environ['HF_TOKEN'],
    local_dir="./flux"  # 本地保存路径
)
