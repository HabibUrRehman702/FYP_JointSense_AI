/**
 * @swagger
 * components:
 *   schemas:
 *     XRayImage:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         patientId:
 *           type: string
 *         imageUrl:
 *           type: string
 *         uploadDate:
 *           type: string
 *           format: date-time
 *         metadata:
 *           type: object
 *
 * /api/xrays:
 *   get:
 *     summary: Get all X-ray images
 *     tags: [X-Rays]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of X-ray images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/XRayImage'
 *   post:
 *     summary: Upload new X-ray image
 *     tags: [X-Rays]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               patientId:
 *                 type: string
 *     responses:
 *       201:
 *         description: X-ray uploaded successfully
 *
 * /api/predictions:
 *   get:
 *     summary: Get all AI predictions
 *     tags: [AI Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of predictions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AIPrediction'
 *   post:
 *     summary: Create new AI prediction
 *     tags: [AI Predictions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               xrayId:
 *                 type: string
 *               patientId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Prediction created successfully
 *
 * /api/activity:
 *   get:
 *     summary: Get activity logs
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of activity logs
 *   post:
 *     summary: Log new activity
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivityLog'
 *     responses:
 *       201:
 *         description: Activity logged successfully
 *
 * /api/diet:
 *   get:
 *     summary: Get diet logs
 *     tags: [Diet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of diet logs
 *   post:
 *     summary: Log new meal
 *     tags: [Diet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DietLog'
 *     responses:
 *       201:
 *         description: Meal logged successfully
 *
 * /api/weight:
 *   get:
 *     summary: Get weight logs
 *     tags: [Weight]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of weight logs
 *   post:
 *     summary: Log new weight entry
 *     tags: [Weight]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WeightLog'
 *     responses:
 *       201:
 *         description: Weight logged successfully
 *
 * /api/medications:
 *   get:
 *     summary: Get medication reminders
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of medications
 *   post:
 *     summary: Create medication reminder
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Medication'
 *     responses:
 *       201:
 *         description: Medication created successfully
 *
 * /api/consultations:
 *   get:
 *     summary: Get consultations
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled, rescheduled]
 *     responses:
 *       200:
 *         description: List of consultations
 *   post:
 *     summary: Schedule new consultation
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Consultation'
 *     responses:
 *       201:
 *         description: Consultation scheduled successfully
 *
 * /api/forum:
 *   get:
 *     summary: Get forum posts
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of forum posts
 *   post:
 *     summary: Create new forum post
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForumPost'
 *     responses:
 *       201:
 *         description: Post created successfully
 *
 * /api/forum/{postId}/comments:
 *   post:
 *     summary: Add comment to forum post
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 *
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of notifications
 *   put:
 *     summary: Mark notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *
 * /api/recommendations:
 *   get:
 *     summary: Get personalized recommendations
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of recommendations
 *
 * /api/progress:
 *   get:
 *     summary: Get progress reports
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progress report data
 *
 * /api/doctor-patient-relations:
 *   get:
 *     summary: Get doctor-patient relationships
 *     tags: [Doctor-Patient Relations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of relationships
 *   post:
 *     summary: Create doctor-patient relationship
 *     tags: [Doctor-Patient Relations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doctorId:
 *                 type: string
 *               patientId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Relationship created successfully
 *
 * /api/kl-grades:
 *   get:
 *     summary: Get KL grade classifications
 *     tags: [KL Grades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of KL grades
 *
 * /api/messages:
 *   get:
 *     summary: Get messages between users
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: conversationWith
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiverId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *
 * /api/audit-logs:
 *   get:
 *     summary: Get audit logs (Admin only)
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of audit logs
 *
 * /api/consultations/{id}:
 *   delete:
 *     summary: Delete consultation (Admin only)
 *     tags: [Consultations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Consultation ID
 *     responses:
 *       200:
 *         description: Consultation deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Consultation deleted successfully
 *       403:
 *         description: Not authorized (Admin only)
 *       404:
 *         description: Consultation not found
 *
 * /api/forum/comments/{id}:
 *   put:
 *     summary: Update forum comment
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               body:
 *                 type: string
 *                 example: Updated comment text
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Comment not found
 *   delete:
 *     summary: Delete forum comment
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully (including all replies)
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Comment not found
 *
 * /api/forum/comments/{id}/like:
 *   put:
 *     summary: Like/Unlike forum comment
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     likes:
 *                       type: number
 *                     isLiked:
 *                       type: boolean
 *       404:
 *         description: Comment not found
 *
 * /api/progress/reports/{id}:
 *   delete:
 *     summary: Delete progress report (Admin only)
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Progress report ID
 *     responses:
 *       200:
 *         description: Progress report deleted successfully
 *       403:
 *         description: Not authorized (Admin only)
 *       404:
 *         description: Progress report not found
 *
 * /api/progress/progression/{userId}:
 *   delete:
 *     summary: Delete disease progression (Admin only)
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Disease progression deleted successfully
 *       403:
 *         description: Not authorized (Admin only)
 *       404:
 *         description: Disease progression not found
 *
 * /api/doctor-patient-relations/{id}/permanent:
 *   delete:
 *     summary: Permanently delete doctor-patient relationship (Admin only)
 *     tags: [Doctor-Patient Relations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Relationship ID
 *     responses:
 *       200:
 *         description: Relationship permanently deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Doctor-patient relationship permanently deleted
 *       403:
 *         description: Not authorized (Admin only)
 *       404:
 *         description: Relationship not found
 *
 * /api/activity/{id}:
 *   delete:
 *     summary: Delete activity log
 *     tags: [Activity]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity log deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Activity log not found
 *
 * /api/diet/{id}:
 *   delete:
 *     summary: Delete diet log
 *     tags: [Diet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Diet log deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Diet log not found
 *
 * /api/weight/{id}:
 *   delete:
 *     summary: Delete weight log
 *     tags: [Weight]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Weight log deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Weight log not found
 *
 * /api/medications/{id}:
 *   delete:
 *     summary: Delete medication reminder
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Medication deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Medication not found
 *
 * /api/xrays/{id}:
 *   delete:
 *     summary: Delete X-ray image
 *     tags: [X-Rays]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: X-ray deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: X-ray not found
 *
 * /api/predictions/{id}:
 *   delete:
 *     summary: Delete AI prediction (Admin only)
 *     tags: [AI Predictions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Prediction deleted successfully
 *       403:
 *         description: Not authorized (Admin only)
 *       404:
 *         description: Prediction not found
 *
 * /api/recommendations/{id}:
 *   delete:
 *     summary: Delete recommendation (Doctor/Admin only)
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recommendation deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Recommendation not found
 *
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Notification not found
 *
 * /api/messages/{id}:
 *   delete:
 *     summary: Delete message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Message not found
 *
 * /api/forum/posts/{id}:
 *   delete:
 *     summary: Delete forum post
 *     tags: [Forum]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Forum post deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Forum post not found
 *
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Not authorized (Admin only)
 *       404:
 *         description: User not found
 */

module.exports = {};
