#!/bin/bash
cd front-end
npm config set registry https://registry.npmmirror.com  # 淘宝源（国内推荐）

# git clone git@github.com:wenkangwei/AI-BookMon.git
# cd AI-BookMon
# corepack enable
# pnpm install
# pnpm install --frozen-lockfile
# pnpm run build
# npx next build
# npm run dev


cd AI-BookMon && \
rm -rf .next node_modules && \
corepack enable && \
pnpm install --frozen-lockfile && \
pnpm run build
npm run dev


# npm cache clean --force
# npm install --legacy-peer-deps
# npm run dev

# rm -rf .next node_modules package-lock.json

# # 重新安装
# npm install

# # 启动纯净环境测试
# npm run dev -- --no-cache