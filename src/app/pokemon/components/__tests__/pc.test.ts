import { describe, it, expect } from 'vitest';
import { depositPokemon, withdrawPokemon, canDeposit, canWithdraw } from '../PCScreen';
import { createPokemon } from '../../engine/state';

function makePokemon(speciesId: string, level: number) {
  return createPokemon(speciesId, level);
}

describe('PC Storage Logic', () => {
  describe('canDeposit', () => {
    it('returns true when team has more than 1', () => {
      expect(canDeposit(2)).toBe(true);
      expect(canDeposit(6)).toBe(true);
    });
    it('returns false when team has 1 or fewer', () => {
      expect(canDeposit(1)).toBe(false);
      expect(canDeposit(0)).toBe(false);
    });
  });

  describe('canWithdraw', () => {
    it('returns true when team has fewer than 6', () => {
      expect(canWithdraw(5)).toBe(true);
      expect(canWithdraw(1)).toBe(true);
    });
    it('returns false when team has 6', () => {
      expect(canWithdraw(6)).toBe(false);
    });
  });

  describe('depositPokemon', () => {
    it('moves pokemon from team to pc', () => {
      const team = [makePokemon('emberon', 5), makePokemon('aqualing', 5)];
      const pc: ReturnType<typeof makePokemon>[] = [];
      const result = depositPokemon(team, pc, 0);
      expect(result).not.toBeNull();
      expect(result!.team).toHaveLength(1);
      expect(result!.pc).toHaveLength(1);
      expect(result!.team[0].speciesId).toBe('aqualing');
      expect(result!.pc[0].speciesId).toBe('emberon');
    });

    it('deposits second pokemon correctly', () => {
      const team = [makePokemon('emberon', 5), makePokemon('aqualing', 5), makePokemon('sproutley', 5)];
      const pc: ReturnType<typeof makePokemon>[] = [];
      const result = depositPokemon(team, pc, 1);
      expect(result).not.toBeNull();
      expect(result!.team).toHaveLength(2);
      expect(result!.team[0].speciesId).toBe('emberon');
      expect(result!.team[1].speciesId).toBe('sproutley');
      expect(result!.pc[0].speciesId).toBe('aqualing');
    });

    it('returns null when team has only 1 pokemon', () => {
      const team = [makePokemon('emberon', 5)];
      const result = depositPokemon(team, [], 0);
      expect(result).toBeNull();
    });

    it('returns null for invalid index', () => {
      const team = [makePokemon('emberon', 5), makePokemon('aqualing', 5)];
      expect(depositPokemon(team, [], -1)).toBeNull();
      expect(depositPokemon(team, [], 5)).toBeNull();
    });

    it('appends to existing pc storage', () => {
      const team = [makePokemon('emberon', 5), makePokemon('aqualing', 5)];
      const pc = [makePokemon('sproutley', 10)];
      const result = depositPokemon(team, pc, 0);
      expect(result).not.toBeNull();
      expect(result!.pc).toHaveLength(2);
      expect(result!.pc[0].speciesId).toBe('sproutley');
      expect(result!.pc[1].speciesId).toBe('emberon');
    });
  });

  describe('withdrawPokemon', () => {
    it('moves pokemon from pc to team', () => {
      const team = [makePokemon('emberon', 5)];
      const pc = [makePokemon('aqualing', 10)];
      const result = withdrawPokemon(team, pc, 0);
      expect(result).not.toBeNull();
      expect(result!.team).toHaveLength(2);
      expect(result!.pc).toHaveLength(0);
      expect(result!.team[1].speciesId).toBe('aqualing');
    });

    it('returns null when team is full (6)', () => {
      const team = Array.from({ length: 6 }, () => makePokemon('emberon', 5));
      const pc = [makePokemon('aqualing', 10)];
      const result = withdrawPokemon(team, pc, 0);
      expect(result).toBeNull();
    });

    it('returns null for invalid index', () => {
      const team = [makePokemon('emberon', 5)];
      const pc = [makePokemon('aqualing', 10)];
      expect(withdrawPokemon(team, pc, -1)).toBeNull();
      expect(withdrawPokemon(team, pc, 5)).toBeNull();
    });

    it('withdraws correct pokemon from middle of storage', () => {
      const team = [makePokemon('emberon', 5)];
      const pc = [makePokemon('aqualing', 10), makePokemon('sproutley', 15), makePokemon('emberon', 20)];
      const result = withdrawPokemon(team, pc, 1);
      expect(result).not.toBeNull();
      expect(result!.team).toHaveLength(2);
      expect(result!.team[1].speciesId).toBe('sproutley');
      expect(result!.pc).toHaveLength(2);
      expect(result!.pc[0].speciesId).toBe('aqualing');
      expect(result!.pc[1].speciesId).toBe('emberon');
    });

    it('allows withdrawing up to team max of 6', () => {
      const team = Array.from({ length: 5 }, () => makePokemon('emberon', 5));
      const pc = [makePokemon('aqualing', 10)];
      const result = withdrawPokemon(team, pc, 0);
      expect(result).not.toBeNull();
      expect(result!.team).toHaveLength(6);
    });
  });

  describe('deposit then withdraw round-trip', () => {
    it('preserves pokemon data through deposit and withdraw', () => {
      const original = makePokemon('aqualing', 15);
      const team = [makePokemon('emberon', 5), original];
      const pc: ReturnType<typeof makePokemon>[] = [];

      const afterDeposit = depositPokemon(team, pc, 1)!;
      expect(afterDeposit.pc[0].uid).toBe(original.uid);
      expect(afterDeposit.pc[0].level).toBe(15);

      const afterWithdraw = withdrawPokemon(afterDeposit.team, afterDeposit.pc, 0)!;
      expect(afterWithdraw.team).toHaveLength(2);
      expect(afterWithdraw.team[1].uid).toBe(original.uid);
      expect(afterWithdraw.pc).toHaveLength(0);
    });
  });
});
