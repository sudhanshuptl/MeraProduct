# MeraProduct Documentation

Welcome to MeraProduct documentation! This directory contains comprehensive guides and documentation for users and developers.

## 📚 Main Documentation

### Essential Reading

1. **[User Guide](USER_GUIDE.md)** - Complete guide for end users
   - Installation and setup
   - How to use the extension
   - Features and settings
   - FAQ and troubleshooting
   - Privacy information

2. **[Developer Guide](DEVELOPER_GUIDE.md)** - Technical reference for developers
   - Architecture overview
   - Code structure and components
   - Detection algorithms
   - Development workflow
   - Testing and deployment

3. **[Changelog](CHANGELOG.md)** - Version history and updates
   - Latest bug fixes
   - New features
   - Known issues
   - Upcoming features

## 🚀 Quick Start

**For Users:**
- Read: [User Guide](USER_GUIDE.md) → [Getting Started](USER_GUIDE.md#getting-started)

**For Developers:**
- Read: [Developer Guide](DEVELOPER_GUIDE.md) → [Architecture Overview](DEVELOPER_GUIDE.md#architecture-overview)
- Clone repo and see: [Development Workflow](DEVELOPER_GUIDE.md#development-workflow)

## �� Documentation Structure

```
docs/
├── README.md              # This file
├── USER_GUIDE.md          # Complete user documentation
├── DEVELOPER_GUIDE.md     # Complete developer documentation
├── CHANGELOG.md           # Version history and updates
│
├── features/              # Feature-specific docs (legacy)
├── fixes/                 # Bug fix documentation (legacy)
├── guides/                # Step-by-step guides (legacy)
└── debug/                 # Debug and logging docs (legacy)
```

**Note:** Legacy folders retained for reference. All new documentation should go in the main consolidated files.

## 🎯 Finding What You Need

### I want to...

**...install and use the extension**
→ [User Guide](USER_GUIDE.md)

**...understand how it works**
→ [Developer Guide - Architecture](DEVELOPER_GUIDE.md#architecture-overview)

**...contribute code**
→ [Developer Guide - Development Workflow](DEVELOPER_GUIDE.md#development-workflow)

**...report a bug**
→ [User Guide - Troubleshooting](USER_GUIDE.md#troubleshooting)

**...see what changed**
→ [Changelog](CHANGELOG.md)

**...deploy to Chrome Store**
→ [Developer Guide - Deployment](DEVELOPER_GUIDE.md#deployment)

**...understand detection logic**
→ [Developer Guide - Detection Logic](DEVELOPER_GUIDE.md#detection-logic)

**...enable debug mode**
→ [User Guide - Settings](USER_GUIDE.md#settings) or [Developer Guide - Debug & Logging](DEVELOPER_GUIDE.md#debug--logging)

## 🔍 Legacy Documentation

The following folders contain legacy documentation for specific features and fixes:

### features/
- Badge design and implementation
- History feature
- Address detection
- Clickable badge

### fixes/
- Bug fix summaries
- Country extraction fixes
- False positive prevention
- Settings panel fixes

### guides/
- Chrome Store deployment
- Badge troubleshooting
- Setup guides

### debug/
- Debug mode implementation
- Logging guides
- Debug history

**Note:** Most content from these folders has been consolidated into the main guides. They're kept for reference and historical context.

## 📝 Contributing to Docs

### Adding New Documentation

**For new features:**
1. Update [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) with technical details
2. Update [USER_GUIDE.md](USER_GUIDE.md) with user-facing information
3. Add entry to [CHANGELOG.md](CHANGELOG.md)

**For bug fixes:**
1. Document in [CHANGELOG.md](CHANGELOG.md)
2. Update relevant sections in other guides if needed

**For new guides:**
- Add to appropriate section in main consolidated docs
- Create separate file only if extensive (>500 lines)

### Documentation Standards

- Use clear, concise language
- Include code examples where helpful
- Add screenshots for UI-related docs
- Keep table of contents updated
- Use proper markdown formatting
- Test all links before committing

## 🌐 External Resources

- **GitHub Repository:** https://github.com/sudhanshuptl/MeraProduct
- **Chrome Extension Docs:** https://developer.chrome.com/docs/extensions/
- **Manifest V3 Guide:** https://developer.chrome.com/docs/extensions/mv3/intro/

## 💬 Get Help

- **Issues:** [GitHub Issues](https://github.com/sudhanshuptl/MeraProduct/issues)
- **Discussions:** [GitHub Discussions]
- **Email:** [Your Email]

---

**Last Updated:** October 21, 2025  
**Documentation Version:** 2.0
