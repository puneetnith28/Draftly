export class Id {
  public readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Id cannot be empty.');
    }
    this.value = value;
  }

  /**
   * Value Objects are defined by their attributes, not an identity.
   * Two IDs are equal if their internal string values match.
   */
  public equals(other: Id): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.value === other.value;
  }
}
