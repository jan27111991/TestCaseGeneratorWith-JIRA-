import express from 'express';
import { JiraClient } from '../jira/jiraClient';
import { JiraConfig } from '../jira/types';

const router = express.Router();
const jiraClient = new JiraClient();

// If environment variables for Jira are present, try to configure the client automatically.
try {
    const envBase = process.env.JIRA_API_BASE_URL;
    const envEmail = process.env.JIRA_EMAIL;
    let envToken = process.env.JIRA_API_TOKEN;

    if (envBase && envEmail && envToken) {
        // Trim whitespace and surrounding quotes from token
        envToken = envToken.toString().trim().replace(/^"|"$/g, '');
        const cfg: JiraConfig = { baseUrl: envBase, email: envEmail, apiToken: envToken };
        console.log('Attempting automatic Jira config from environment (baseUrl/email logged, token omitted).');
        jiraClient.setConfig(cfg);
        jiraClient.validateConnection().then(ok => {
            console.log('Automatic Jira env connection status:', ok);
            if (!ok) {
                console.warn('Automatic Jira connection failed. Server will still accept manual connections.');
            }
        }).catch(err => {
            console.warn('Automatic Jira connection attempt failed with error:', err?.message || err);
        });
    }
} catch (e) {
    console.warn('Error while initializing Jira client from env:', e);
}

router.post('/connect', async (req, res) => {
    try {
        const { baseUrl, email, apiToken } = req.body;
        
        if (!baseUrl || !email || !apiToken) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: baseUrl, email, or apiToken'
            });
        }

        const config: JiraConfig = { baseUrl, email, apiToken };

        // Log baseUrl and email for debugging (do not log API token)
        console.log('Jira connect attempt:', { baseUrl, email });

        jiraClient.setConfig(config);
        const isValid = await jiraClient.validateConnection();

        if (!isValid) {
            // Include last error from JiraClient if available to help debugging
            const last = jiraClient.getLastError();
            return res.status(401).json({
                success: false,
                error: last || 'Invalid Jira credentials'
            });
        }

        return res.json({ success: true });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/stories', async (req, res) => {
    try {
        const result = await jiraClient.getStories();
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/stories/:key', async (req, res) => {
    try {
        const result = await jiraClient.getStoryDetails(req.params.key);
        return res.json(result);
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;