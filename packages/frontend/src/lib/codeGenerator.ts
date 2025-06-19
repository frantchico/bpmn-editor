// Helper function to format sequence number
function formatSequence(seq: number): string {
  return seq.toString().padStart(2, '0');
}

// Helper function to extract sequence from existing codes
// Example: codes = ["PROJ-01", "PROJ-02"], prefix = "PROJ-" -> returns 2
// Example: codes = ["AREA.01", "AREA.02"], prefix = "AREA." -> returns 2
function getMaxSequence(existingCodes: string[], prefix: string): number {
  let maxSeq = 0;
  existingCodes.forEach(code => {
    if (code.startsWith(prefix)) {
      const seqStr = code.substring(prefix.length);
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });
  return maxSeq;
}

/**
 * Generates a new code for an Area.
 * Example: projectCode = "SIGA", existingAreaCodes = ["SIGA-01"] -> "SIGA-02"
 * @param projectCode The code of the parent project.
 * @param existingAreaCodes A list of codes of existing areas within the same project.
 * @returns The new area code.
 */
export function generateAreaCode(projectCode: string, existingAreaCodes: string[]): string {
  const prefix = `${projectCode}-`;
  const nextSeq = getMaxSequence(existingAreaCodes, prefix) + 1;
  return `${prefix}${formatSequence(nextSeq)}`;
}

/**
 * Generates a new code for a SubArea.
 * Example: areaCode = "SIGA-01", existingSubAreaCodes = ["SIGA-01.01"] -> "SIGA-01.02"
 * @param areaCode The code of the parent area.
 * @param existingSubAreaCodes A list of codes of existing sub-areas within the same area.
 * @returns The new sub-area code.
 */
export function generateSubAreaCode(areaCode: string, existingSubAreaCodes: string[]): string {
  const prefix = `${areaCode}.`;
  const nextSeq = getMaxSequence(existingSubAreaCodes, prefix) + 1;
  return `${prefix}${formatSequence(nextSeq)}`;
}

/**
 * Generates a new code for a Process.
 * Example: subAreaCode = "SIGA-01.01", existingProcessCodes = ["SIGA-01.01.01"] -> "SIGA-01.01.02"
 * @param subAreaCode The code of the parent sub-area.
 * @param existingProcessCodes A list of codes of existing processes within the same sub-area.
 * @returns The new process code.
 */
export function generateProcessCode(subAreaCode: string, existingProcessCodes: string[]): string {
  const prefix = `${subAreaCode}.`;
  const nextSeq = getMaxSequence(existingProcessCodes, prefix) + 1;
  return `${prefix}${formatSequence(nextSeq)}`;
}
