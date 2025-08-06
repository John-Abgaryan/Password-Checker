// Language System
const translations = {
    en: {
        title: "Password Strength Checker",
        subtitle: "Test your password security and get personalized tips",
        placeholder: "Enter your password...",
        generateTitle: "Generate Strong Password",
        toggleTitle: "Toggle Password Visibility",
        strengthLevels: {
            "very-weak": "Very Weak",
            "weak": "Weak", 
            "fair": "Fair",
            "good": "Good",
            "strong": "Strong",
            "very-strong": "Very Strong"
        },
        criteriaTitle: "Password Requirements",
        criteria: {
            length: "At least 8 characters",
            uppercase: "Contains uppercase letter",
            lowercase: "Contains lowercase letter", 
            number: "Contains number",
            special: "Contains special character"
        },
        tipsTitle: "Security Tips",
        tips: {
            unique: "Use a unique password for every account",
            avoid: "Avoid personal info like birthdays or names",
            length: "Longer passwords are exponentially stronger",
            update: "Update passwords regularly for security"
        },
        toastCopied: "Password copied to clipboard!"
    },
    gr: {
        title: "Έλεγχος Κωδικού",
        subtitle: "Δοκίμασε την ασφάλεια του κωδικού σου και πάρε συμβουλές",
        placeholder: "Γράψε τον κωδικό σου...",
        generateTitle: "Δημιουργία Ισχυρού Κωδικού",
        toggleTitle: "Εμφάνιση/Απόκρυψη Κωδικού",
        strengthLevels: {
            "very-weak": "Πολύ Αδύναμος",
            "weak": "Αδύναμος",
            "fair": "Μέτριος", 
            "good": "Καλός",
            "strong": "Ισχυρός",
            "very-strong": "Πολύ Ισχυρός"
        },
        criteriaTitle: "Απαιτήσεις Κωδικού",
        criteria: {
            length: "Τουλάχιστον 8 χαρακτήρες",
            uppercase: "Περιέχει κεφαλαίο γράμμα",
            lowercase: "Περιέχει μικρό γράμμα",
            number: "Περιέχει αριθμό", 
            special: "Περιέχει ειδικό χαρακτήρα"
        },
        tipsTitle: "Συμβουλές Ασφάλειας",
        tips: {
            unique: "Χρησιμοποίησε μοναδικό κωδικό για κάθε λογαριασμό",
            avoid: "Αποφυγή προσωπικών στοιχείων όπως γενέθλια ή ονόματα",
            length: "Μεγαλύτεροι κωδικοί είναι πιο ασφαλείς",
            update: "Ενημέρωσε τους κωδικούς σου τακτικά για ασφάλεια"
        },
        toastCopied: "Ο κωδικός αντιγράφηκε!"
    }
};

let currentLang = 'en';
let typingInProgress = false;

// Typing Animation Class
class TypingAnimation {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            typingSpeed: 50,
            deletingSpeed: 30,
            pauseDuration: 1000,
            cursorCharacter: '|',
            cursorBlinkDuration: 0.5,
            showCursor: true,
            ...options
        };
        
        this.isTyping = false;
        this.isDeleting = false;
        this.currentText = '';
        this.targetText = '';
        this.cursorElement = null;
        this.textElement = null;
        this.cursorPaused = false;
        
        this.init();
    }
    
    init() {
        // Create text and cursor elements
        this.element.innerHTML = '';
        this.textElement = document.createElement('span');
        this.textElement.className = 'typing-text';
        this.element.appendChild(this.textElement);
        
        if (this.options.showCursor) {
            this.cursorElement = document.createElement('span');
            this.cursorElement.className = 'typing-cursor';
            this.cursorElement.textContent = this.options.cursorCharacter;
            this.element.appendChild(this.cursorElement);
            this.startCursorBlink();
        }
    }
    
    startCursorBlink() {
        if (!this.cursorElement || this.cursorPaused) return;
        
        // Kill any existing animations first
        gsap.killTweensOf(this.cursorElement);
        gsap.set(this.cursorElement, { opacity: 1 });
        gsap.to(this.cursorElement, {
            opacity: 0,
            duration: this.options.cursorBlinkDuration,
            repeat: -1,
            yoyo: true,
            ease: "power2.inOut"
        });
    }
    
    async typeText(newText) {
        if (this.isTyping) return;
        
        this.isTyping = true;
        this.targetText = newText;
        
        // Delete current text if it exists
        if (this.currentText.length > 0) {
            await this.deleteText();
        }
        
        // Type new text
        await this.addText();
        
        // Stop cursor blinking for 1 second when done
        if (this.cursorElement) {
            this.cursorPaused = true;
            gsap.killTweensOf(this.cursorElement);
            gsap.set(this.cursorElement, { opacity: 1 });
            
            setTimeout(() => {
                this.cursorPaused = false;
                if (this.cursorElement) {
                    this.startCursorBlink();
                }
            }, 1000);
        }
        
        this.isTyping = false;
    }
    
    deleteText() {
        return new Promise((resolve) => {
            this.isDeleting = true;
            
            const deleteChar = () => {
                if (this.currentText.length === 0) {
                    this.isDeleting = false;
                    resolve();
                    return;
                }
                
                this.currentText = this.currentText.slice(0, -1);
                this.textElement.textContent = this.currentText;
                
                setTimeout(deleteChar, this.options.deletingSpeed);
            };
            
            deleteChar();
        });
    }
    
    addText() {
        return new Promise((resolve) => {
            let charIndex = 0;
            
            const typeChar = () => {
                if (charIndex >= this.targetText.length) {
                    resolve();
                    return;
                }
                
                this.currentText += this.targetText[charIndex];
                this.textElement.textContent = this.currentText;
                charIndex++;
                
                setTimeout(typeChar, this.options.typingSpeed);
            };
            
            // Small pause before starting to type
            setTimeout(typeChar, this.options.pauseDuration / 4);
        });
    }
    
    setText(text) {
        this.currentText = text;
        this.textElement.textContent = text;
    }
}

// Language Toggle
function toggleLanguage() {
    if (typingInProgress) return;
    
    currentLang = currentLang === 'en' ? 'gr' : 'en';
    updateLanguage();
}

async function updateLanguage() {
    typingInProgress = true;
    const t = translations[currentLang];
    
    // Update flag icon
    const flagIcon = document.querySelector('.flag-icon');
    flagIcon.className = `flag-icon flag-icon-${currentLang === 'en' ? 'gb' : 'gr'}`;
    
    // Get all elements that need typing animation
    const elementsToAnimate = [
        { element: document.querySelector('.header h1'), text: t.title },
        { element: document.querySelector('.header p'), text: t.subtitle },
        { element: document.querySelector('.criteria-section h3'), text: t.criteriaTitle },
        { element: document.querySelector('.tips-section h3'), text: t.tipsTitle }
    ];
    
    // Create typing animations for main elements
    const typingPromises = elementsToAnimate.map(async ({ element, text }, index) => {
        if (!element.typingAnimation) {
            element.typingAnimation = new TypingAnimation(element, {
                typingSpeed: 40,
                deletingSpeed: 20,
                pauseDuration: 200
            });
        }
        
        // Stagger the animations
        await new Promise(resolve => setTimeout(resolve, index * 300));
        return element.typingAnimation.typeText(text);
    });
    
    // Wait for main animations to start, then update other elements
    setTimeout(() => {
        // Update input placeholder
        document.getElementById('passwordInput').placeholder = t.placeholder;
        document.getElementById('generateBtn').title = t.generateTitle;
        document.getElementById('toggleBtn').title = t.toggleTitle;
        
        // Update criteria (no animation for these)
        document.querySelectorAll('.criterion span').forEach((span, index) => {
            const criteriaKeys = ['length', 'lowercase', 'uppercase', 'number', 'special'];
            span.textContent = t.criteria[criteriaKeys[index]];
        });
        
        // Update tips (no animation for these)
        document.querySelectorAll('.tip p').forEach((tip, index) => {
            const tipKeys = ['unique', 'avoid', 'length', 'update'];
            tip.textContent = t.tips[tipKeys[index]];
        });
        
        // Update strength text if password exists
        const strengthText = document.querySelector('.strength-text');
        if (strengthText.textContent && strengthText.className.includes('strength-text')) {
            const currentStrength = strengthText.className.split(' ').find(cls => cls !== 'strength-text');
            if (currentStrength && t.strengthLevels[currentStrength]) {
                strengthText.textContent = t.strengthLevels[currentStrength];
            }
        }
    }, 800);
    
    // Wait for all animations to complete
    await Promise.all(typingPromises);
    typingInProgress = false;
}

// Password Strength Calculator
class PasswordChecker {
    constructor() {
        this.passwordInput = document.getElementById('passwordInput');
        this.togglePassword = document.getElementById('toggleBtn');
        this.strengthFill = document.getElementById('strengthFill');
        this.strengthText = document.getElementById('strengthText');
        this.generateBtn = document.getElementById('generateBtn');
        this.toast = document.getElementById('toast');
        
        this.criteria = {
            length: document.getElementById('length'),
            lowercase: document.getElementById('lowercase'),
            uppercase: document.getElementById('uppercase'),
            number: document.getElementById('number'),
            special: document.getElementById('special')
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateStrength();
    }
    
    bindEvents() {
        // Password input events
        this.passwordInput.addEventListener('input', () => {
            this.updateStrength();
        });
        
        this.passwordInput.addEventListener('paste', () => {
            setTimeout(() => {
                this.updateStrength();
            }, 10);
        });
        
        // Toggle password visibility
        this.togglePassword.addEventListener('click', () => {
            this.togglePasswordVisibility();
        });
        
        // Generate password
        this.generateBtn.addEventListener('click', () => {
            this.generateStrongPassword();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'g') {
                e.preventDefault();
                this.generateStrongPassword();
            }
        });
    }
    
    updateStrength() {
        const password = this.passwordInput.value;
        const score = this.calculateScore(password);
        const strength = this.getStrengthLevel(score);
        
        this.updateStrengthMeter(strength);
        this.updateCriteria(password);
    }
    
    calculateScore(password) {
        let score = 0;
        
        // Length scoring
        if (password.length >= 8) score += 25;
        if (password.length >= 12) score += 15;
        if (password.length >= 16) score += 10;
        
        // Character type scoring
        if (/[a-z]/.test(password)) score += 15;
        if (/[A-Z]/.test(password)) score += 15;
        if (/[0-9]/.test(password)) score += 15;
        if (/[^a-zA-Z0-9]/.test(password)) score += 15;
        
        // Bonus scoring
        if (password.length >= 10 && /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(password)) {
            score += 10;
        }
        
        // Penalty for common patterns
        if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
        if (/123|abc|qwe|asd|zxc/i.test(password)) score -= 15; // Sequential patterns
        if (/password|123456|qwerty|admin|login/i.test(password)) score -= 25; // Common passwords
        
        return Math.max(0, Math.min(100, score));
    }
    
    getStrengthLevel(score) {
        if (score === 0) return 'none';
        if (score < 30) return 'weak';
        if (score < 50) return 'fair';
        if (score < 70) return 'good';
        if (score < 85) return 'strong';
        return 'very-strong';
    }
    
    updateStrengthMeter(strength) {
        const t = translations[currentLang];
        const strengthTexts = {
            none: currentLang === 'en' ? 'Enter a password' : 'Εισάγετε κωδικό',
            weak: t.strengthLevels.weak,
            fair: t.strengthLevels.fair,
            good: t.strengthLevels.good,
            strong: t.strengthLevels.strong,
            'very-strong': t.strengthLevels['very-strong']
        };
        
        // Remove all strength classes
        this.strengthFill.className = 'strength-fill';
        this.strengthText.className = 'strength-text';
        
        // Add current strength class
        if (strength !== 'none') {
            this.strengthFill.classList.add(strength);
            this.strengthText.classList.add(strength);
        }
        
        this.strengthText.textContent = strengthTexts[strength];
        
        // Animate the strength meter
        gsap.to(this.strengthFill, {
            duration: 0.3,
            ease: "power2.out"
        });
    }
    
    updateCriteria(password) {
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^a-zA-Z0-9]/.test(password)
        };
        
        Object.keys(checks).forEach(key => {
            const element = this.criteria[key];
            const icon = element.querySelector('.criterion-icon');
            
            if (checks[key]) {
                element.classList.add('valid');
                icon.className = 'fas fa-check criterion-icon';
                
                // Animate check
                gsap.fromTo(icon, 
                    { scale: 0, rotation: -180 },
                    { scale: 1, rotation: 0, duration: 0.3, ease: "back.out(1.7)" }
                );
            } else {
                element.classList.remove('valid');
                icon.className = 'fas fa-times criterion-icon';
            }
        });
    }
    
    togglePasswordVisibility() {
        const isPassword = this.passwordInput.type === 'password';
        const icon = this.togglePassword.querySelector('i');
        
        this.passwordInput.type = isPassword ? 'text' : 'password';
        icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
        
        // Keep focus on input
        this.passwordInput.focus();
        
        // Animate icon
        gsap.fromTo(icon, 
            { scale: 0.8, rotation: isPassword ? 0 : 180 },
            { scale: 1, rotation: isPassword ? 180 : 0, duration: 0.2 }
        );
    }
    
    generateStrongPassword() {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        const allChars = lowercase + uppercase + numbers + symbols;
        const length = 16;
        
        let password = '';
        
        // Ensure at least one character from each category
        password += this.getRandomChar(lowercase);
        password += this.getRandomChar(uppercase);
        password += this.getRandomChar(numbers);
        password += this.getRandomChar(symbols);
        
        // Fill the rest randomly
        for (let i = 4; i < length; i++) {
            password += this.getRandomChar(allChars);
        }
        
        // Shuffle the password
        password = this.shuffleString(password);
        
        // Animate input and set value
        gsap.fromTo(this.passwordInput, 
            { scale: 0.95 },
            { 
                scale: 1, 
                duration: 0.3,
                ease: "back.out(1.7)",
                onComplete: () => {
                    this.passwordInput.value = password;
                    this.updateStrength();
                    
                    // Flash effect
                    gsap.fromTo(this.passwordInput,
                        { backgroundColor: 'rgba(82, 39, 255, 0.1)' },
                        { backgroundColor: 'transparent', duration: 0.5 }
                    );
                }
            }
        );
    }
    
    getRandomChar(str) {
        return str.charAt(Math.floor(Math.random() * str.length));
    }
    
    shuffleString(str) {
        return str.split('').sort(() => Math.random() - 0.5).join('');
    }
    
    async copyPassword() {
        const password = this.passwordInput.value;
        if (!password) return;
        
        try {
            await navigator.clipboard.writeText(password);
            this.showToast();
            
            // Animate generate button
            gsap.to(this.generateBtn, {
                scale: 0.95,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: "power2.inOut"
            });
            
        } catch (err) {
            console.error('Failed to copy password:', err);
            
            // Fallback for older browsers
            this.passwordInput.select();
            document.execCommand('copy');
            this.showToast();
        }
    }
    
    showToast() {
        const t = translations[currentLang];
        this.toast.querySelector('span').textContent = t.toastCopied;
        this.toast.classList.add('show');
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
        
        // Animate toast
        gsap.fromTo(this.toast,
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
        );
    }
}

// Enhanced interactions with dot grid
class DotGridInteractions {
    constructor(passwordChecker) {
        this.passwordChecker = passwordChecker;
        this.init();
    }
    
    init() {
        // Add typing animation effects only
        this.passwordChecker.passwordInput.addEventListener('keydown', (e) => {
            this.createTypingEffect(e);
        });
    }
    
    createTypingEffect(e) {
        if (!window.dotGrid) return;
        
        // Create a small "pulse" effect at random dots when typing
        const randomDots = window.dotGrid.dots
            .sort(() => Math.random() - 0.5)
            .slice(0, 2);
        
        randomDots.forEach((dot, index) => {
            setTimeout(() => {
                if (!dot._inertiaApplied) {
                    gsap.to(dot, {
                        xOffset: (Math.random() - 0.5) * 8,
                        yOffset: (Math.random() - 0.5) * 8,
                        duration: 0.2,
                        ease: "power2.out",
                        onComplete: () => {
                            gsap.to(dot, {
                                xOffset: 0,
                                yOffset: 0,
                                duration: 0.6,
                                ease: "elastic.out(1,0.5)"
                            });
                        }
                    });
                }
            }, index * 30);
        });
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize language toggle
    const languageToggle = document.getElementById('languageToggle');
    if (languageToggle) {
        languageToggle.addEventListener('click', toggleLanguage);
    }
    
    // Initialize password checker
    const passwordChecker = new PasswordChecker();
    
    // Initialize dot grid interactions
    const dotGridInteractions = new DotGridInteractions(passwordChecker);
    
    // Add some entrance animations
    gsap.fromTo('.password-checker-card', 
        { 
            opacity: 0, 
            y: 50,
            scale: 0.9
        },
        { 
            opacity: 1, 
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            delay: 0.2
        }
    );
    
    // Animate criteria items
    gsap.fromTo('.criterion', 
        { opacity: 0, x: -20 },
        { 
            opacity: 1, 
            x: 0,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.5,
            ease: "power2.out"
        }
    );
    
    // Animate tips
    gsap.fromTo('.tip', 
        { opacity: 0, y: 20 },
        { 
            opacity: 1, 
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.8,
            ease: "power2.out"
        }
    );
    
    // Add hover effects to buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            gsap.to(btn, { scale: 1.05, duration: 0.2 });
        });
        
        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { scale: 1, duration: 0.2 });
        });
    });
});
