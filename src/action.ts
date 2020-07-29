import * as utility from './utility'

export async function createChangelog(owner: string, repo: string, milestoneNumberOrTitle: string, config: any): Promise<string> {
  return await formatChangelog(owner, repo, milestoneNumberOrTitle, config)
}

async function formatChangelog(owner: string, repo: string, milestoneNumberOrTitle: string, config: any): Promise<string> {
  let format = ''

  if (config.body !== '') {
    const milestone = await utility.getMilestone(owner, repo, milestoneNumberOrTitle)

    if (milestone != null) {
      const groups = await getGroups(owner, repo, milestone.number, config)
      const values = {
        milestone: milestone,
        groups: groups,
        groupsFormatted: formatGroups(groups, config, milestone)
      }

      format += utility.formatValues(config.body, values)
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
    const values = {
      milestone: milestone,
      groups: groups,
      group: group,
      issuesFormatted: formatIssues(group.issues, config, milestone, groups, group)
    }

    format += utility.formatValues(config.group, values)
    format += '\n'
  }

  return format
}

function formatIssues(issues: any[], config: any, milestone: any, groups: any[], group: any): string {
  let format = ''

  for (const issue of issues) {
    const values = {
      milestone: milestone,
      groups: groups,
      group: group,
      issue: issue
    }

    format += utility.formatValues(config.issue, values)

    if (config.issueBody && issue.body !== '') {
      const body = utility.indent(issue.body.trim(), 4)

      format += `${body}\n`
    }
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
