import api from './api.js';

export const prescriptionService = {
    list: (appointmentId) =>
        api.get(`/appointments/${appointmentId}/prescriptions`).then(r => r.data),

    create: (appointmentId, dto) =>
        api.post(`/appointments/${appointmentId}/prescriptions`, dto).then(r => r.data),

    update: (rxId, dto) =>
        api.put(`/prescriptions/${rxId}`, dto).then(r => r.data),

    delete: (rxId) =>
        api.delete(`/prescriptions/${rxId}`),

    /**
     * Fetch the PDF as a Blob (so the JWT interceptor adds Authorization)
     * and trigger a browser download. The bytes never round-trip through the
     * URL bar, so the token isn't exposed.
     */
    async downloadPdf(appointmentId) {
        const res = await api.get(`/appointments/${appointmentId}/prescriptions.pdf`, {
            responseType: 'blob',
        });
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prescription-${appointmentId.slice(0, 8)}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
};
