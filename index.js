const core = require('@actions/core');
const axios = require('axios');

async function run() {
  try {
    core.info(`get inputs ...`);
    const url = core.getInput('portainer-url', {required: true});
    const api_key = core.getInput('portainer-api-key', {required: true});
    const endpoint = parseInt(core.getInput('portainer-endpoint', {required: true}));
    const stack = parseInt(core.getInput('portainer-stack', {required: true}));
    const tag = core.getInput('portainer-tag', {required: false});
    const registry = core.getInput('portainer-registry', {required: false});

    core.info(`get stack env ... ${url}/api/stacks/${stack}`);
    let stack_data = await axios({ method: 'get', url: `${url}/api/stacks/${stack}`, headers: { 'X-API-Key': api_key } })

    core.info(`get stack file ... ${url}/api/stacks/${stack}/file`);
    let stack_file = await axios({ method: 'get', url: `${url}/api/stacks/${stack}/file`, headers: { 'X-API-Key': api_key } })
    let stackContent = stack_file.data.StackFileContent
    if(tag != "" && registry != ""){
      var regexStr = new RegExp(String.raw`(image:\s${registry}[a-z.\/-]+:[a-z]+)(-?)(\s?)([a-z]*)`, "g");
      stackContent = stackContent.replaceAll(regexStr, "$1-"+ tag)
    }
      
    core.info(stackContent);
    core.info(`update stack & repull image ...`);
    let update = await axios({
      method: 'put',
      url: `${url}/api/stacks/${stack}?endpointId=${endpoint}`,
      headers: { 'X-API-Key': api_key, 'Content-Type': 'application/json' },
      data: JSON.stringify({
        "StackFileContent": stackContent,
        "Env": stack_data.data.Env,
        "Prune": false,
        "PullImage": true
      })
    })

    core.setOutput('status', update.status);
  } catch (error) {
    core.info(`Failed`);
    core.info(error.message);
    core.setFailed(error.message);
  }
}

run();
