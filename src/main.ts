import * as core from '@actions/core'
import * as action from './action'
import * as utility from './utility'

run()

async function run(): Promise<void> {
  try {
    const milestone = core.getInput('milestone', {required: true})
    const repository = core.getInput('repository', {required: true})
    const config = core.getInput('config', {required: true})
    const configType = core.getInput('configType', {required: true})
    const ownerAndRepo = utility.getOwnerAndRepo(repository)

    const result = await action.createChangelog(ownerAndRepo.owner, ownerAndRepo.repo, milestone, config, configType)

    core.setOutput('result', result)
  } catch (error) {
    core.setFailed(error.message)
  }
}
