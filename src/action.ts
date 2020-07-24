import * as utility from './utility'

export async function createChangelog(owner: string, repo: string, milestoneNumberOrTitle: string, configPath: string, configType: string): Promise<string> {
  const config = await utility.readData(configPath, configType)
  const content = await formatChangelog(owner, repo, milestoneNumberOrTitle, config)

  return content
}

async function formatChangelog(owner: string, repo: string, milestoneNumberOrTitle: string, config: any): Promise<string> {
  let format = ''

  if (config.body !== '') {
    const milestone = await utility.getMilestone(owner, repo, milestoneNumberOrTitle)

    if (milestone != null) {
      const groups = await getGroups(owner, repo, milestone.number, config)
      const bodyValues = {
        milestone: milestone,
        groups: formatGroups(groups, config, milestone)
      }

      format += utility.formatValues(config.body, bodyValues)
    } else {
      format += config.empty
    }

    format = utility.normalize(format)
  }

  return format
}

function formatGroups(groups: any[], config: any, milestone: any): string {
  let format = ''

  for (const group of groups) {
    const groupValues = {
      milestone: milestone,
      group: group,
      issues: formatIssues(group.issues, config, milestone, group)
    }

    format += utility.formatValues(config.group, groupValues)
  }

  return format
}

function formatIssues(issues: any[], config: any, milestone: any, group: any): string {
  let format = ''

  for (const issue of issues) {
    const issueValues = {
      milestone: milestone,
      group: group,
      issue: issue
    }

    format += utility.formatValues(config.issue, issueValues)
  }

  return format
}

async function getGroups(owner: string, repo: string, number: number, config: any): Promise<any[]> {
  const groups = []

  for (const group of config.groups) {
    const issues = await utility.getMilestoneIssues(owner, repo, number, group.state, group.labels)

    if (issues.length > 0) {
      groups.push({
        name: group.name,
        issues: issues
      })
    }
  }

  return groups
}
