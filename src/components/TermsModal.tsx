
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { APP_NAME } from "@/lib/env";

interface TermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFeedbackClick: () => void;
}

const TermsModal = ({ open, onOpenChange, onFeedbackClick }: TermsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{APP_NAME} Terms and Conditions</DialogTitle>
        </DialogHeader>
        
        <div className="pt-6">
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Introduction</h2>
            <p className="text-muted-foreground mb-4">
              Welcome to {APP_NAME}, a minimalist smart todo application designed to help you organize your tasks effectively.
              By accessing or using {APP_NAME}, you agree to comply with and be bound by the following terms and conditions.
              Please review these terms carefully before using the application.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Data Security</h2>
            <p className="text-muted-foreground mb-4">
              {APP_NAME} takes your privacy seriously. All your task data is encrypted both locally on your device and in our secure Supabase database.
              This encryption helps ensure that your information remains private and protected from unauthorized access.
              We implement industry-standard security practices to safeguard your data.
            </p>
            <p className="text-muted-foreground mb-4">
              Our encryption approach uses AES-256 (Advanced Encryption Standard with 256-bit keys) to protect your task content.
              Your encryption keys are derived from your user credentials, ensuring that only you can access your data.
              This end-to-end encryption means that even our database administrators cannot read your task content.
            </p>
            <p className="text-muted-foreground mb-4">
              Key security features of our encryption implementation:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
              <li>End-to-end encryption of all task content</li>
              <li>User-specific encryption keys derived from your credentials</li>
              <li>AES-256 encryption algorithm (military-grade security)</li>
              <li>Encrypted data both in local storage and in the cloud database</li>
              <li>Backward compatibility with previously unencrypted data</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">AI-Powered Features</h2>
            <p className="text-muted-foreground mb-4">
              {APP_NAME} uses Google's Gemini AI to power intelligent features such as type-ahead suggestions for your tasks.
              This integration is designed to enhance your productivity while maintaining strict privacy standards.
            </p>
            <p className="text-muted-foreground mb-4">
              When you type in the task input field, small portions of your text may be sent to Google's Gemini API to 
              generate relevant task suggestions. These suggestions appear as you type and can be accepted or ignored based on your preference.
            </p>
            <p className="text-muted-foreground mb-4">
              It's important to understand:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
              <li>Only the text you are currently typing is sent to the API (not your entire task history)</li>
              <li>No personal information is shared with the API beyond what you type in the suggestion field</li>
              <li>Your data is not stored by Google for purposes beyond generating immediate suggestions</li>
              <li>We implement client-side caching to minimize API calls and improve performance</li>
              <li>You may disable AI-powered suggestions in the application settings if desired</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Analytics and Tracking</h2>
            <p className="text-muted-foreground mb-4">
              {APP_NAME} uses PostHog analytics to help us understand how the application is used and to improve the user experience.
              We collect anonymous usage data such as feature interactions and app navigation patterns.
              We never analyze the content of your tasks or personal information.
              This analytics data helps us make {APP_NAME} better for everyone.
            </p>
            <p className="text-muted-foreground mb-4">
              Our analytics implementation focuses on respecting your privacy. We collect:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
              <li>Feature usage statistics (which features are most popular)</li>
              <li>Navigation patterns (how users move through the application)</li>
              <li>UI interaction data (to improve usability)</li>
              <li>Error reports (to fix issues quickly)</li>
              <li>AI suggestion acceptance rates (to improve suggestion quality)</li>
            </ul>
            <p className="text-muted-foreground">
              We do not collect or analyze:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
              <li>The content of your tasks</li>
              <li>Personal identifiable information (unless you explicitly provide it)</li>
              <li>Your passwords or encryption keys</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
            <p className="text-muted-foreground mb-4">
              Your task data is stored for as long as you maintain an account with {APP_NAME}.
              Completed tasks may be archived but remain accessible to you through the application.
              Local data is stored in your browser's storage until explicitly cleared.
            </p>
            <p className="text-muted-foreground mb-4">
              If you choose to delete your account, we will permanently remove all your data from our servers within 30 days.
              However, some anonymized analytics data may remain in our systems.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">User Rights</h2>
            <p className="text-muted-foreground mb-4">
              As a user of {APP_NAME}, you have the right to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccuracies in your personal data</li>
              <li>Delete your account and associated data</li>
              <li>Export your task data</li>
              <li>Opt-out of non-essential analytics</li>
              <li>Disable AI-powered features at any time</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              If you wish to exercise any of these rights, please contact us using the feedback form in the application.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Changes to Terms</h2>
            <p className="text-muted-foreground mb-4">
              We may update these terms from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
              We will notify you of any material changes through the application or via the email associated with your account.
              Continued use of {APP_NAME} after such notifications constitutes your acceptance of the updated terms.
            </p>
          </section>
          
          <div className="mt-12 pt-6 border-t text-center text-muted-foreground text-sm">
            <p>Last updated: May 8, 2025</p>
            <p className="mt-2">
              If you have any questions about these terms, please{" "}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onFeedbackClick();
                }}
                className="text-blue-500 hover:text-blue-400 cursor-pointer outline-none focus:outline-none"
              >
                contact us via the feedback form
              </button>.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsModal;
