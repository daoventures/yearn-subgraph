``` cmd
graph auth https://api.thegraph.com/deploy/ <APIKEY>

graph deploy --debug --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ <graph account name>/<graph name>
```

Steps to deploy:
1. Add vault's contract address to `{network}.json` file under `config` folder.
2. Add vault's detail into `{network}.template.yaml` file under `template` folder.
3. Run `yarn prepare:{network}` to build subgraph.yaml file.
4. Run `graph codegen`. For further urther explanation, please refer [here](https://thegraph.com/docs/developer/create-subgraph-hosted).
5. Run `yarn deploy:{network}` for deploy.

```
Note:
1. Change `EACAggregatorProxy` contract address to adapt the network used.
2. Deploy the by running the command 
`