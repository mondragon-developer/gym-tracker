import { beforeEach, describe, expect, it, vi } from 'vitest';
const rpc = vi.hoisted(() => vi.fn());
vi.mock('../lib/supabase.js', () => ({ supabase: { rpc } }));
import { approveTrainer, listMyTrainers, previewTrainer, removeTrainerAccess } from './TrainerAccessService.js';

beforeEach(() => rpc.mockReset());
describe('trainer access service', () => {
    it('normalizes invitation codes without mutating a relationship', async () => {
        rpc.mockResolvedValue({ data: [{ trainer_id: 't1', display_name: 'Alex' }], error: null });
        expect(await previewTrainer(' abc123 ')).toEqual({ trainer_id: 't1', display_name: 'Alex' });
        expect(rpc).toHaveBeenCalledExactlyOnceWith('preview_trainer_access', { code: 'ABC123' });
    });
    it('binds approval to the reviewed trainer, disclosure version and language', async () => {
        rpc.mockResolvedValue({ data: true, error: null });
        await approveTrainer(' abc123 ', 't1', 'es');
        expect(rpc).toHaveBeenCalledExactlyOnceWith('approve_trainer_access', {
            code: 'ABC123', expected_trainer: 't1', consent_version: '2026-10-02', consent_language: 'es'
        });
    });
    it('rejects a changed or revoked invitation', async () => {
        rpc.mockResolvedValue({ data: false, error: null });
        await expect(approveTrainer('ABC123', 't1', 'en')).rejects.toThrow();
    });
    it('never supplies a client id for listing or removal; the server derives the caller', async () => {
        rpc.mockResolvedValueOnce({ data: [], error: null }).mockResolvedValueOnce({ data: true, error: null });
        await listMyTrainers();
        await removeTrainerAccess('t1');
        expect(rpc).toHaveBeenNthCalledWith(1, 'list_my_trainers', undefined);
        expect(rpc).toHaveBeenNthCalledWith(2, 'remove_my_trainer', { target_trainer: 't1' });
    });
    it('propagates server errors instead of displaying false success', async () => {
        rpc.mockResolvedValue({ data: null, error: new Error('denied') });
        await expect(removeTrainerAccess('t1')).rejects.toThrow('denied');
    });
});
