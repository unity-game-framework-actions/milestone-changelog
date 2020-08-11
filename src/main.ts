import * as core from '@actions/core'
import * as action from './action'
import * as utility from './utility'

run()

async function run(): Promise<void> {
  try {
    const milestone = core.getInput('milestone', {required: true})
    const repository = utility.getRepository()
    const config = await utility.readConfigAny()
    const result = await action.createChangelog(repository.owner, repository.repo, milestone, config)

    await utility.setOutput(result)
  } catch (error) {
    core.setFailed(error.message)
  }
}
