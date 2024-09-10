import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

// Function to run a command
export const runCommand = async (command: string) => {
  try {
    const { stdout, stderr } = await execPromise(command)

    if (stderr) {
      console.error(`Error: ${stderr}`)
    }

    console.log(stdout)
  } catch (error) {
    console.error(`Command failed: ${error}`)
  }
}
