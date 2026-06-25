import { Button, Html } from 'react-email';

interface EmailProps {
  url: string;
}

export const Email: React.FC<Readonly<EmailProps>> = ({ url }) => {
  return (
    <Html lang="en">
      <h1>Verify your email address</h1>
      <p>Click the button below to verify your email address:</p>
      <Button href={url}>Click here</Button>
    </Html>
  );
};

export const ResetPasswordEmail: React.FC<Readonly<EmailProps>> = ({ url }) => {
  return (
    <Html lang="en">
      <h1>Reset your password</h1>
      <p>Click the button below to reset your password:</p>
      <p>url : {url}</p>
      <Button href={url}>Click here</Button>
    </Html>
  );
};

