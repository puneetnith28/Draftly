export class FolderColor {
  public readonly value: string;

  constructor(value: string) {
    // Basic hex color validation (e.g., #7c8cff)
    if (!/^#[0-9A-Fa-f]{6}$/i.test(value)) {
      throw new Error(`Invalid folder color: ${value}. Must be a valid 6-character hex code.`);
    }
    // Normalize to lowercase for consistent equality checks
    this.value = value.toLowerCase();
  }

  /**
   * Value Objects are defined by their attributes, not an identity.
   * Two FolderColors are equal if their hex values match.
   */
  public equals(other: FolderColor): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.value === other.value;
  }
}
