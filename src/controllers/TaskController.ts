import { Request, Response } from "express";
import Project from "../models/Project.model";
import Task from "../models/Task.model";
import Note from "../models/Note.model";
import User from "../models/User.model";
import ProjectUser from "../models/ProjectUser.model";

export class TaskController {
    static async createTask(req: Request, res: Response) {
        const { projectId } = req.params;
        const { description } = req.body;

        const project = await Project.findByPk(projectId);

        if (!project) {
            res.status(404).send('Proyecto No Encontrado');
            return;
        }

        try {
            await Task.create({
                description: description,
                projectId: +projectId
            });

            res.send('Tarea Creada Correctamente');
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getTaskById(req: Request, res: Response) {
        const { taskId } = req.params;
        try {
            const task = await Task.findByPk(taskId,
                {
                    attributes: ['id', 'description', 'status', 'createdAt'],
                    include: [{
                        model: Note, as: 'notes', attributes: ['id', 'description', 'createdAt'], include: [{ model: User, as: 'author', attributes: ['id', 'name', 'profileImg'] }],
                    }, { model: User, as: 'assignee', attributes: ['id', 'name', 'email', 'profileImg'] }],
                });

            if (!task) {
                res.status(404).send('Tarea no Encontrada');
                return;
            }

            res.json(task);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async updateTask(req: Request, res: Response) {
        try {
            const { taskId } = req.params;
            const { description } = req.body;

            const task = await Task.findByPk(taskId);

            if (!task) {
                res.status(404).send('Tarea No Encontrada');
                return;
            }

            task.description = description;

            await task.save();

            res.json('Tarea Actualizada Correctamente');

        } catch (error) {
            res.status(500).send({ error: 'Hubo un error' });
        }
    }

    static async changeTaskStatus(req: Request, res: Response) {
        try {
            const { taskId } = req.params;
            const { status } = req.body;
            const task = await Task.findByPk(taskId);

            if (!task) {
                res.status(404).send('Tarea No Encontrada');
                return;
            }

            task.status = status;
            await task.save()

            res.send('Tarea Actualizada Correctamente');
        } catch (error) {
            res.status(500).send({ error: error.message });
        }
    }

    static async deleteTask(req: Request, res: Response) {
        try {
            const { taskId, projectId } = req.params;
            const task = await Task.findByPk(taskId);
            const project = await Project.findByPk(projectId);

            if (!task) {
                res.status(404).send('Tarea No Encontrada');
                return;
            }

            if (!project) {
                res.status(404).send('Projecto No Encontrado');
                return;
            }

            if (req.user.id != project.managerId) {
                res.status(403).send('No Autorizado');
                return;
            }

            await task.destroy();

            res.send('Tarea Eliminada Correctamente');
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async assignEmployeeToTask(req: Request, res: Response) {
        try {
            const { taskId, userId } = req.params;
            const task = await Task.findByPk(taskId);
            const user = await User.findByPk(userId);

            if (!task) {
                res.status(404).send('Tarea No Encontrada');
                return;
            }

            if (!user) {
                res.status(404).send('Usuario No Encontrado');
                return;
            }

            const assign = await ProjectUser.findOne({ where: { projectId: task.projectId, userId: user.id } });

            if (!assign) {
                res.status(404).send('El Usuario no es Colaborador');
                return;
            }

            task.assigneeId = user.id;
            task.save();

            res.send('Asignado Correctamente');
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    }
}