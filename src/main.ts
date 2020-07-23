import * as core from '@actions/core'
import * as action from './action'

run()

async function run(): Promise<void> {
  try {
    const milestone = core.getInput('milestone', {required: true})
    const owner = core.getInput('owner', {required: true})
    const repo = core.getInput('repo', {required: true})
    const config = core.getInput('config', {required: true})
    const configType = core.getInput('configType', {required: true})

    const content = await action.createChangelog(owner, repo, milestone, config, configType)

    core.setOutput('content', content)
  } catch (error) {
    core.setFailed(error.message)
  }
}
