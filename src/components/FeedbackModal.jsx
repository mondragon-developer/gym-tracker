import React, { useState, useRef, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { ButtonVariant } from './ui/Button.constants.js';
import Input from './ui/Input';
import { t } from '../translations/ui';

// Anti-spam: bots fill every field; humans skip the hidden one. We also
// require at least 3s on the form before allowing submit.
const MIN_TIME_TO_SUBMIT_MS = 3000;

/**
 * Feedback Modal Component
 * Allows users to send feedback about the app via EmailJS
 */
const FeedbackModal = ({ isOpen, onClose, language = 'en' }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [honeypot, setHoneypot] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);
    const openedAtRef = useRef(0);

    useEffect(() => {
        if (isOpen) openedAtRef.current = Date.now();
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Silently drop bot submissions: honeypot filled, or submitted too fast.
        const elapsed = Date.now() - openedAtRef.current;
        if (honeypot || elapsed < MIN_TIME_TO_SUBMIT_MS) {
            setSubmitStatus('success');
            setTimeout(() => {
                setFormData({ name: '', email: '', message: '' });
                setSubmitStatus(null);
                onClose();
            }, 2000);
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

            await emailjs.send(
                import.meta.env.VITE_EMAILJS_SERVICE_ID,
                import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
                {
                    from_name: formData.name,
                    from_email: formData.email,
                    message: formData.message,
                    to_email: import.meta.env.VITE_FEEDBACK_EMAIL || 'your-email@example.com',
                }
            );

            setSubmitStatus('success');
            setTimeout(() => {
                setFormData({ name: '', email: '', message: '' });
                setSubmitStatus(null);
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Failed to send feedback:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`💬 ${t("Send Feedback", language)}`}
        >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Honeypot — invisible to users, irresistible to bots */}
                <div
                    aria-hidden="true"
                    style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}
                >
                    <label>
                        Website
                        <input
                            type="text"
                            name="website"
                            tabIndex={-1}
                            autoComplete="off"
                            value={honeypot}
                            onChange={(e) => setHoneypot(e.target.value)}
                        />
                    </label>
                </div>
                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '4px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151'
                    }}>
                        {t("Name", language)}
                    </label>
                    <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={t("Your name", language)}
                        required
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '4px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151'
                    }}>
                        {t("Email", language)}
                    </label>
                    <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '4px',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151'
                    }}>
                        {t("Message", language)}
                    </label>
                    <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder={t("Your feedback about the app...", language)}
                        required
                        disabled={isSubmitting}
                        rows={5}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: '16px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            backgroundColor: 'white',
                            transition: 'all 0.2s ease',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            color: '#374151',
                            outline: 'none'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#3b82f6';
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#d1d5db';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>

                {submitStatus === 'success' && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontWeight: '500'
                    }}>
                        ✅ {t("Feedback sent successfully! Thank you!", language)}
                    </div>
                )}

                {submitStatus === 'error' && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontWeight: '500'
                    }}>
                        ❌ {t("Failed to send feedback. Please try again.", language)}
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginTop: '8px'
                }}>
                    <Button
                        type="submit"
                        variant={ButtonVariant.PRIMARY}
                        fullWidth
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? t("Sending...", language) : t("Send Feedback", language)}
                    </Button>
                    <Button
                        type="button"
                        variant={ButtonVariant.SECONDARY}
                        onClick={onClose}
                        fullWidth
                        disabled={isSubmitting}
                    >
                        {t("Cancel", language)}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default FeedbackModal;