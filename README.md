# VRF
Verifiable Random Number generator

Install dependencies:

npm install 

Run:

npm run start

Compile smart contract:

npx hardhat compile

deploy contract:

`npm run deploy:berachain`

verify contract deployment:
npm run verify VRF_CONTRACT_ADDRESS

steps:

Run server:

    ts-node src/server.ts 

generate config:

    curl --location 'http://localhost:3000/generate_config' \
    --header 'Content-Type: application/json' \
    --data '{
    "jobId": 2,
    "rewardsAddress": "0xd1F0c3F6FCf756f486276E4F1CAe572784bDB14E",
    "gasKey": "0x9fda92bd4fb11108438a426ec845debfd9f4e88c6aa3fcad69ca3f4560ba2a22"
    }'

run scheduler:
    
    ts-node src/scheduler.ts

Install esbuild:

    curl -fsSL https://esbuild.github.io/dl/latest | sh     

How to build a single bundled file:

    ./esbuild src/scheduler.ts --bundle --outdir=dist --platform=node
    ./esbuild src/server.ts --bundle --outdir=dist --platform=node

Run binary file:

    sudo ts-node ./dist/scheduler.js "*/1 * * * *"                    

To test locally:
    
    npx hardhat test