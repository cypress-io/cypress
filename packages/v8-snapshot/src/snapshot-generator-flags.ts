/**
 * Bitwise flags which means they can be combined,
 * i.e. `Flags.Script | Flags.DoctorFresh`
 *
 * See {@link GeneratorFlags}.
 */
// prettier-ignore
export enum Flag {
  None = 0x0000,
  /** if set a snapshot script is generated */
  Script = 0x0001,
  /** if set a snapshot binary is generated from the snapshot script */
  MakeSnapshot = 0x0002,
  /**
   * if set the doctor will use previously collected information about which
   * modules should be defererred, etc. as long as the yarn.lock file didn't
   * change
   */
  ReuseDoctorArtifacts = 0x0004,
}

/**
 * API to {@link SnapshotGenerator} {@link Flag}s.
 */
export class GeneratorFlags {
  constructor (private flags: Flag) {}

  public has (flag: number): boolean {
    return !!(this.flags & flag)
  }

  public add (flag: Flag) {
    this.flags |= flag
  }

  public delete (flag: Flag) {
    this.flags &= ~flag
  }
}
