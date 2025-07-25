import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import Modal from './ui/Modal';
import Button, { ButtonVariant } from './ui/Button';
import Input from './ui/Input';

/**
 * Feedback Modal Component
 * Allows users to send feedback about the app via EmailJS
 */
const FeedbackModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus(null);

        try {
            // Initialize EmailJS with public key
            emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

            // Send email
            await emailjs.send(
                import.meta.env.VITE_EMAILJS_SERVICE_ID,
                import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
                {
                    from_name: formData.name,
                    from_email: formData.email,
                    message: formData.message,
                    to_email: import.meta.env.VITE_FEEDBACK_EMAIL || 'your-email@example.com', // Configure in .env
                }
            );

            setSubmitStatus('success');
            // Clear form after success
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
            title="💬 Send Feedback"
        >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '4px', 
                        fontSize: '14px', 
                        fontWeight: '500',
                        color: '#374151'
                    }}>
                        Name
                    </label>
                    <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
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
                        Email
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
                        Message
                    </label>
                    <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Your feedback about the app..."
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
                        ✅ Feedback sent successfully! Thank you!
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
                        ❌ Failed to send feedback. Please try again.
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
                        {isSubmitting ? 'Sending...' : 'Send Feedback'}
                    </Button>
                    <Button
                        type="button"
                        variant={ButtonVariant.SECONDARY}
                        onClick={onClose}
                        fullWidth
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default FeedbackModal;