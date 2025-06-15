# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| < 2.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in Worknotes, please follow these steps:

1. **Do not** create a public GitHub issue
2. Email the security team at [security@yourdomain.com](mailto:security@yourdomain.com) with details of the vulnerability
3. Include steps to reproduce the issue and any relevant logs
4. We will respond to your report within 48 hours
5. We will work on a fix and keep you updated on our progress

## Security Measures

### Secure Development
- All code is reviewed before being merged
- Dependencies are regularly updated and scanned for vulnerabilities
- Automated security testing is part of our CI/CD pipeline

### Data Protection
- All user data is encrypted at rest and in transit
- Authentication uses secure, industry-standard protocols
- Regular security audits are performed

### Environment Variables
- Never commit sensitive information to version control
- Use `.env` files for local development (added to `.gitignore`)
- Store production secrets in secure environment variable stores

## Best Practices

### For Developers
- Never hardcode API keys or credentials
- Use environment variables for all configuration
- Keep dependencies up to date
- Follow the principle of least privilege

### For Deployment
- Use HTTPS for all connections
- Set secure HTTP headers
- Implement proper CORS policies
- Regularly rotate API keys and credentials

## Security Updates

Security updates are released as patch versions (e.g., 2.0.1, 2.0.2). We recommend always running the latest patch version of your current minor version.

## Acknowledgments

We would like to thank the following individuals and organizations for responsibly disclosing security issues:

- [Your Name Here]

## License

This security policy is subject to the terms of the MIT License.
