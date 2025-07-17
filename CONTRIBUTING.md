# Contributing to Gym Tracker App

Thank you for your interest in contributing to the Gym Tracker App! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/gym-tracker-app.git
   cd gym-tracker-app/gym-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Run linting**
   ```bash
   npm run lint
   ```

### Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Test your changes locally
4. Run the linter and fix any issues
5. Commit your changes with descriptive messages
6. Push to your fork and create a pull request

## 🏗️ Code Standards

### File Structure

- **Components**: Place in `src/components/` with descriptive names
- **Services**: Business logic goes in `src/services/`
- **Utils**: Helper functions in `src/utils/`
- **Constants**: Shared constants in `src/constants/`

### Naming Conventions

- **Components**: PascalCase (e.g., `ExerciseItem.jsx`)
- **Functions**: camelCase (e.g., `handleUpdate`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DAYS_OF_WEEK`)
- **Files**: Use descriptive names matching their primary export

### Code Style

- **ESLint**: Follow the project's ESLint configuration
- **Imports**: 
  - React imports first
  - Third-party library imports
  - Local imports (relative paths)
- **JSDoc**: Document all functions and components
- **PropTypes**: Not required but TypeScript conversion welcome

### Component Guidelines

```jsx
import React, { useState } from 'react';
import { Icon } from 'lucide-react';

/**
 * Component description
 * @param {object} props
 * @param {string} props.title - Description
 * @returns {React.ReactElement}
 */
const MyComponent = ({ title }) => {
    const [state, setState] = useState(false);

    const handleClick = () => {
        setState(!state);
    };

    return (
        <div>
            <h1>{title}</h1>
            <button onClick={handleClick}>
                <Icon size={16} />
            </button>
        </div>
    );
};

export default MyComponent;
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment**: Browser, OS, device type
2. **Steps to reproduce**: Clear, numbered steps
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Console errors**: Check browser dev tools

### Bug Report Template

```markdown
## Bug Description
Brief description of the issue

## Environment
- Browser: Chrome 91.0
- OS: Windows 10
- Device: Desktop

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
If applicable

## Console Errors
Any errors in browser console
```

## 💡 Feature Requests

For new features, please:

1. Check existing issues to avoid duplicates
2. Provide clear use cases
3. Consider implementation complexity
4. Be open to discussion about approach

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this work?

## Alternatives Considered
Other approaches you've thought about

## Additional Context
Screenshots, examples, etc.
```

## 🔍 Testing

### Manual Testing Checklist

Before submitting a PR, please test:

- [ ] App builds without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Features work on desktop
- [ ] Features work on mobile
- [ ] Data persists correctly
- [ ] No console errors

### Testing New Features

- Test with empty data state
- Test with populated data
- Test edge cases (very long exercise names, etc.)
- Test responsive behavior
- Test keyboard navigation

## 📝 Documentation

### Code Documentation

- Add JSDoc comments to all functions
- Document component props
- Explain complex logic with inline comments
- Update README if adding new features

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add exercise search functionality
fix: resolve drag-and-drop on mobile
docs: update installation instructions
refactor: simplify data persistence logic
```

### Pull Request Guidelines

1. **Title**: Clear, descriptive title
2. **Description**: Explain what and why
3. **Testing**: How you tested the changes
4. **Screenshots**: For UI changes
5. **Breaking Changes**: Note any breaking changes

## 🎨 Design Guidelines

### UI/UX Principles

- **Mobile First**: Design for mobile, enhance for desktop
- **Accessibility**: Consider keyboard navigation and screen readers
- **Performance**: Optimize for smooth interactions
- **Consistency**: Follow existing design patterns

### Tailwind CSS Usage

- Use existing utility classes when possible
- Keep responsive design in mind
- Follow the existing color scheme
- Maintain consistent spacing

## 🔧 Common Tasks

### Adding a New Component

1. Create file in `src/components/`
2. Follow naming conventions
3. Add proper imports and exports
4. Include JSDoc documentation
5. Update parent components as needed

### Adding New Exercise Fields

1. Update data structure in `workoutService.js`
2. Update TypeScript interfaces (if converting)
3. Update `ExerciseItem.jsx` to handle new fields
4. Test data migration for existing users

### Modifying the Exercise Database

1. Update `src/constants/index.js`
2. Ensure backward compatibility
3. Test exercise selection and filtering

## 🚨 Security Considerations

- No sensitive data should be logged
- Validate user inputs where appropriate
- Be cautious with innerHTML or dangerouslySetInnerHTML
- Consider XSS prevention for user-generated content

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Lucide React Icons](https://lucide.dev/)

## 🤝 Community

- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Ask questions when unsure

## 📞 Getting Help

If you need help or have questions:

1. Check existing issues and documentation
2. Create a new issue with the "question" label
3. Provide context and details
4. Be patient and respectful

Thank you for contributing! 🎉