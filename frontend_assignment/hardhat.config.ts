import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-waffle"
import * as dotenv from "dotenv"
import "hardhat-gas-reporter"
import "hardhat-dependency-compiler"
import { HardhatUserConfig } from "hardhat/config"
import "./tasks/deploy"

dotenv.config()

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
    solidity: "0.8.4",
    dependencyCompiler: {
        paths: ["@appliedzkp/semaphore-contracts/base/Verifier.sol"]
    },
    defaultNetwork: 'localhost',
    networks: {
        localhost: {
            url:'http://127.0.0.1:8545/',
            accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"]
        },
        ropsten: {
            url: process.env.ROPSTEN_URL || "",
            accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : []
        }
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: "USD"
    }
}

export default config
