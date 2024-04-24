

// FILE 2 - CONTROLLERS.JS
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




// FILE 2 - SERVICES.JS
import { query } from '../db';

export const getProject = async (id) => {
    const projects = await query('SELECT * FROM projects WHERE id = ? AND status != "DELETED"', [id]).catch(() => ([]));

    if (!projects.length) { return null; }

    return projects[0];
};

export const insertProject = async (data) => {
    // Generate id
    const id = !data.id ? uuidv4() : data.id;

    if (!data.status) { data.status = 'PENDING'; }

    // Mandatory parameters
    if (!data.user_id || !data.solution_id) { throw new Error('user_id and solution_id are required'); }

    // Insert
    if (Object.keys(data).length) {
        await query(`INSERT INTO projects SET ?`, [{ ...data, id }]);
    }

    // Return new project
    return getProject(id);
};

export const updateProject = async (id, data) => {
    if (Object.keys(data).length) {
        await query(`UPDATE projects SET ? WHERE id="${id}"`, [data, id]);
    }

    return getProject(id);
};

