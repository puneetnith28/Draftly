export class FolderColor {
  public readonly value: string;

  constructor(value: string) {
    
    if (!/^#[0-9A-Fa-f]{6}$/i.test(value)) {
      throw new Error(`Invalid folder color: ${value}. Must be a valid 6-character hex code.`);
    }
    
    this.value = value.toLowerCase();
  }

  public equals(other: FolderColor): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.value === other.value;
  }
}
