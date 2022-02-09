// NPM modules
import sgMail from '@sendgrid/mail';

// Importing API_KEY from environment variable
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send Welcome mail to new User
const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'shubham19k24@live.com',
        subject: 'Welcome to Task Manger App!',
        text: `Welcome Mr/Ms ${name}. We hope you have a great experience with our service.`
    })
    .then(() => {
        console.log('Email sent successfully...');
    })
    .catch((error) => {
        console.error(error);
    });
}

// Follow-up mail to the exiting user
const goodbyeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'shubham19k24@live.com',
        subject: 'Feedback for the Task Manager application',
        text: `Hello Mr/Ms ${name}. We hate to see you go. Please rate our services along with your valuable suggestions (if any) to help us improve. Thank you...`
    })
    .then(() => {
        console.log('Email sent successfully...');
    })
    .catch((error) => {
        console.error(error);
    });
}

export { sendWelcomeEmail, goodbyeEmail };