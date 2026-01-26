// Мок данные для разработки (когда SDK недоступен)
export const mockProcesses = {
    success: true,
    data: {
        1: { id: 1, name: "Сделки", entityTypeId: 2 },
        128: { id: 128, name: "Заявки", entityTypeId: 128 },
        134: { id: 134, name: "Проекты", entityTypeId: 134 },
        136: { id: 136, name: "Задачи", entityTypeId: 136 }
    },
    count: 4
};

export const mockFields = {
    success: true,
    data: {
        "TITLE": { title: "Название", type: "string", isRequired: true },
        "COMPANY_ID": { title: "Компания", type: "crm_company" },
        "CONTACT_ID": { title: "Контакт", type: "crm_contact" },
        "ASSIGNED_BY_ID": { title: "Ответственный", type: "user" },
        "STAGE_ID": { title: "Стадия", type: "string" },
        "OPPORTUNITY": { title: "Сумма", type: "double" },
        "COMMENTS": { title: "Комментарии", type: "string" }
    }
};
