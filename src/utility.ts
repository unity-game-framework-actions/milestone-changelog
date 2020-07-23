import * as core from '@actions/core'
import * as github from '@actions/github'
import {promises as fs} from 'fs'
import * as yaml from 'js-yaml'
import * as eol from 'eol'
import indentString from 'indent-string'
import objectPath from 'object-path'

export async function read(path: string): Promise<string> {
  const buffer = await fs.readFile(path)

  return buffer.toString()
}

export async function write(path: string, content: string): Promise<void> {
  await fs.writeFile(path, content)
}

export function format(input: any, type: string): string {
  switch (type) {
    case 'json':
      return JSON.stringify(input)
    case 'yaml':
      return yaml.dump(input)
    default:
      throw `Invalid parse type: '${type}'.`
  }
}

export function parse(input: string, type: string): any {
  if (input === '') {
    return {}
  }

  switch (type) {
    case 'json':
      return JSON.parse(input)
    case 'yaml':
      return yaml.load(input)
    default:
      throw `Invalid parse type: '${type}'.`
  }
}

export function normalize(input: string): string {
  return eol.crlf(input)
}

export function indent(input: string, count: number): string {
  return indentString(input, count)
}

export function getValue(input: any, path: string): any {
  return objectPath.get(input, path)
}

export function setValue(input: any, path: string, value: any) {
  objectPath.set(input, path, value)
}

export function getOwnerAndRepo(repo: string): {owner: string; repo: string} {
  const split = repo.split('/')

  if (split.length < 2) {
    throw `Invalid repository name: '${repo}'.`
  }

  return {
    owner: split[0],
    repo: split[1]
  }
}

export function getOctokit(): any {
  const token = core.getInput('token', {required: true})

  return github.getOctokit(token)
}

export async function getMilestone(owner: string, repo: string, milestoneNumberOrTitle: string): Promise<any> {
  const octokit = getOctokit()

  try {
    const milestones = await octokit.paginate(`GET /repos/${owner}/${repo}/milestones/${milestoneNumberOrTitle}`)

    return milestones[0]
  } catch (error) {
    const milestones = await octokit.paginate(`GET /repos/${owner}/${repo}/milestones?state=all`)

    for (const milestone of milestones) {
      if (milestone.title === milestoneNumberOrTitle) {
        return milestone
      }
    }

    core.info(`Milestone not found by the specified number or title: '${milestoneNumberOrTitle}'.`)

    return null
  }
}

export async function updateContent(owner: string, repo: string, content: string, file: string, branch: string, message: string, user: string, email: string): Promise<void> {
  const octokit = getOctokit()
  const info = await octokit.request(`GET /repos/${owner}/${repo}/contents/${file}?ref=${branch}`)
  const base64 = Buffer.from(content).toString('base64')
  const sha = info.data.sha

  const response = await octokit.repos.createOrUpdateFile({
    owner: owner,
    repo: repo,
    path: file,
    message: message,
    content: base64,
    sha: sha,
    branch: branch,
    committer: {
      name: user,
      email: email
    },
    author: {
      name: user,
      email: email
    }
  })
}

export async function getRelease(owner: string, repo: string, idOrTag: string): Promise<any> {
  const octokit = getOctokit()

  try {
    const releases = await octokit.paginate(`GET /repos/${owner}/${repo}/releases/${idOrTag}`)

    return releases[0]
  } catch (error) {
    const releases = await octokit.paginate(`GET /repos/${owner}/${repo}/releases`)

    for (const release of releases) {
      if (release.tag_name === idOrTag) {
        return release
      }
    }

    core.warning(`Release by the specified id or tag name not found: '${idOrTag}'.`)

    return null
  }
}

export async function updateRelease(owner: string, repo: string, release: any): Promise<void> {
  const octokit = getOctokit()

  const response = await octokit.repos.updateRelease({
    owner: owner,
    repo: repo,
    release_id: release.id,
    tag_name: release.tag_name,
    target_commitish: release.target_commitish,
    name: release.name,
    body: release.body,
    draft: release.draft,
    prerelease: release.prerelease
  })

  core.info('Update Release Response')
  core.info(JSON.stringify(response))
}

export function changeRelease(release: any, change: any): any {
  if (change.tag !== '') {
    release.tag_name = change.tag
  }

  if (change.commitish !== '') {
    release.target_commitish = change.commitish
  }

  if (change.name !== '') {
    release.name = change.name
  }

  if (change.body !== '') {
    release.body = change.body
  }

  if (change.draft !== '') {
    release.draft = change.draft === 'true'
  }

  if (change.prerelease !== '') {
    release.prerelease = change.prerelease === 'true'
  }

  return release
}

export async function dispatch(owner: string, repo: string, eventType: string, payload: any): Promise<void> {
  const octokit = getOctokit()

  await octokit.repos.createDispatchEvent({
    owner: owner,
    repo: repo,
    event_type: eventType,
    client_payload: JSON.stringify(payload)
  })
}
