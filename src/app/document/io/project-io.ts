import { isTauri } from '@/app/tauri/env'

/**
 * Filesystem access for the code import, in whichever shell is running.
 *
 * The parser and writer take their IO as a parameter precisely so this can
 * differ: in the packaged desktop app the webview reads and writes directly
 * through Tauri, and in the browser it has to ask the dev server, because a web
 * page has no filesystem. Same code either way, different plumbing.
 */
export interface ProjectFileIO {
  readDir(path: string): Promise<Array<{ name: string; isDirectory: boolean }>>
  readFile(path: string): Promise<string>
  join(...parts: string[]): string
}

export interface SourceWriteIO {
  read(path: string): Promise<string>
  write(path: string, contents: string): Promise<void>
}

/** Windows and POSIX both accept forward slashes here; normalising avoids mixing. */
function joinPath(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .map((p, i) => (i === 0 ? p.replace(/[\\/]+$/, '') : p.replace(/^[\\/]+|[\\/]+$/g, '')))
    .join('/')
}

function tauriIO(): { project: ProjectFileIO; write: SourceWriteIO } {
  const load = () => import('@tauri-apps/plugin-fs')

  return {
    project: {
      async readDir(path) {
        const { readDir } = await load()
        const entries = await readDir(path)
        return entries.map((e) => ({ name: e.name, isDirectory: e.isDirectory }))
      },
      async readFile(path) {
        const { readTextFile } = await load()
        return readTextFile(path)
      },
      join: joinPath
    },
    write: {
      async read(path) {
        const { readTextFile } = await load()
        return readTextFile(path)
      },
      async write(path, contents) {
        const { writeTextFile } = await load()
        await writeTextFile(path, contents)
      }
    }
  }
}

/**
 * Browser fallback: the dev server does the filesystem work.
 *
 * Only present while developing. A built web app has no such endpoint, and the
 * import surfaces that as an error rather than appearing to work.
 */
function httpIO(): { project: ProjectFileIO; write: SourceWriteIO } {
  const post = async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    })
    const payload = (await res.json()) as { ok: boolean; result?: T; error?: string }
    if (!payload.ok || payload.result === undefined) {
      throw new Error(payload.error ?? `${path} failed`)
    }
    return payload.result
  }

  return {
    project: {
      readDir: (path) => post('/__op/read-dir', { path }),
      readFile: async (path) => (await post<{ text: string }>('/__op/read-file', { path })).text,
      join: joinPath
    },
    write: {
      read: async (path) => (await post<{ text: string }>('/__op/read-file', { path })).text,
      async write(path, contents) {
        await post('/__op/write-file', { path, contents })
      }
    }
  }
}

export function projectIO(): { project: ProjectFileIO; write: SourceWriteIO; native: boolean } {
  const native = isTauri()
  return { ...(native ? tauriIO() : httpIO()), native }
}
