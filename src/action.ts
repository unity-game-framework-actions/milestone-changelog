import * as core from '@actions/core'
import * as utility from './utility'

export async function createChangelog(owner: string, repo: string, milestoneNumberOrTitle: string, configPath: string, configType: string): Promise<string> {
  const config = utility.readData(configPath, configType)

  if (core.isDebug()) {
    core.debug('Config')
    core.debug(JSON.stringify(config, null, 2))
  }

  const content = await createChangelogContent(owner, repo, milestoneNumberOrTitle, config)

  return content
}

async function createChangelogContent(owner: string, repo: string, milestoneNumberOrTitle: string, config: any): Promise<string> {
  let content = ''
  const milestone = await utility.getMilestone(owner, repo, milestoneNumberOrTitle)

  if (config.header !== '') {
    content += `${config.header}\n\n`
  }

  if (config.title !== '') {
    content += `${config.title}\n`
  }

  if (config.description !== '') {
    content += `\n${config.description}\n`
  }

  if (milestone != null) {
    const groups = []

    for (const group of config.groups) {
      const issues = await utility.getMilestoneIssues(owner, repo, milestone.number, group.state, group.labels)

      if (issues.length > 0) {
        groups.push({
          name: group.name,
          issues: issues
        })
      }
    }

    content += formatMilestone(milestone)

    if (groups.length > 0) {
      content += formatIssues(groups)
    } else {
      content += `\n${config.descriptionEmptyRelease}\n`
    }
  } else {
    content += `\n${config.descriptionEmptyRelease}\n`
  }

  content = utility.normalize(content)

  return content
}

function formatMilestone(milestone: any): string {
  let format = ''

  format += `- [Milestone](${milestone.html_url}?closed=1)\n\n`

  if (milestone.description !== '') {
    format += `${milestone.description}\n\n`
  }

  return format
}

function formatIssues(groups: any[]): string {
  let format = ''

  for (const group of groups) {
    format += `### ${group.name}\n`

    for (const issue of group.issues) {
      format += `- ${formatIssue(issue)}\n`
    }

    format += '\n'
  }

  return format
}

function formatIssue(issue: any): string {
  let format = `${issue.title} ([#${issue.number}](${issue.html_url}))`

  if (issue.body !== '') {
    const body = utility.indent(issue.body, 4)

    format += `\n${body}`
  }

  return format
}
