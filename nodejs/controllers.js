import express from 'express';
import config from './config';
import {
    getProject,
    updateProject,
    insertProject,
} from './services.js';

import validationErrorMiddleware from './core/middlewares/validation-error';

const ERROR = { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something wrong happened, check logs' } };
const ERROR_MISSING_PARAMS = { error: { code: 'BAD_REQUEST', message: "You don't give all required parameters" } };

const app = express();
app.use(express.json());

app.get('/project/:projectId', (req, res) => {
    getProject(req.params.projectId).then((project) => {
        if (!project) {
            return res.status(200).send({ error: { code: 'GET_PROJECT_NOT_FOUND', message: 'Project not found' } });
        }
        return res.send({ data: project });
    }).catch((err) => {
        console.error(err);
        res.status(500).send(ERROR);
    });
});

app.post('/projects', async (req, res) => {
    try {
        const project = await insertProject(req.body);

        if (project) {
            return res.status(200).send({ data: project });
        }
        throw new Error('Error while creating project');
    } catch (err) {
        return res.status(500).send(ERROR);
    }
});

app.put('/project/:projectId', async (req, res) => {
    const { projectId } = req.params;
    // Get the project before the update
    const oldProject = await getProject(projectId);

    if (!oldProject) {
        return res.status(500).send('PROJECT NOT FOUND');
    }

    let newProject = null;
    try {
        newProject = await updateProject(projectId, { ...req.body, updated_at: new Date() });
    } catch (err) {
        // Can't update the project
        console.error(err);
        return res.status(500).send(ERROR);
    }
    return res.send({ newProject, oldProject });
});


app.use(validationErrorMiddleware);

// Bind express on the port
const server = app.listen(config.server.port, () => {
    console.log(`🚀 API launched on port ${config.server.port}`);
});