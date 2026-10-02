import { supabase } from '../lib/supabase.js';

// Version of the access disclosure shown in TrainerAccessModal (both languages).
export const TRAINER_ACCESS_VERSION = '2026-10-02';

const call = async (name, args) => {
    const { data, error } = await supabase.rpc(name, args);
    if (error) throw error;
    return data;
};

export const previewTrainer = async (code) => {
    const rows = await call('preview_trainer_access', { code: code.trim().toUpperCase() });
    return rows?.[0] ?? null;
};

export const listMyTrainers = async () => (await call('list_my_trainers')) ?? [];

export const approveTrainer = async (code, trainerId, language) => {
    const approved = await call('approve_trainer_access', {
        code: code.trim().toUpperCase(),
        expected_trainer: trainerId,
        consent_version: TRAINER_ACCESS_VERSION,
        consent_language: language
    });
    if (approved !== true) throw new Error('Trainer invitation changed or is no longer valid');
};

export const removeTrainerAccess = async (trainerId) => {
    const removed = await call('remove_my_trainer', { target_trainer: trainerId });
    if (removed !== true) throw new Error('Could not remove trainer access');
};
