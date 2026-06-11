import { apiClient } from "../../../api/client";

export type PublicBusiness = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  businessType?: string;
  bookingSlug: string;
};

export type PublicService = {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: string | number;
  isActive: boolean;
};

export type PublicStaff = {
  id: string;
  businessId: string;
  fullName: string;
  role?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
};

export type AvailableSlot = {
  startTime: string;
  endTime: string;
  startDateTime: string;
  endDateTime: string;
};

export type AvailableSlotsResponse = {
  date: string;
  businessId: string;
  staffId: string;
  serviceId: string;
  durationMinutes: number;
  slots: AvailableSlot[];
};

export type CreatePublicAppointmentPayload = {
  staffId: string;
  serviceId: string;
  startDateTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

export type PublicAppointment = {
  id: string;
  businessId: string;
  staffId: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  bookingReference: string;
  createdAt: string;
  updatedAt: string;
  staff?: PublicStaff;
  service?: PublicService;
};

export async function getPublicBusiness(bookingSlug: string) {
  const response = await apiClient.get<PublicBusiness>(`/book/${bookingSlug}`);
  return response.data;
}

export async function getPublicServices(bookingSlug: string) {
  const response = await apiClient.get<PublicService[]>(
    `/book/${bookingSlug}/services`
  );

  return response.data;
}

export async function getPublicStaff(bookingSlug: string, serviceId?: string) {
  const response = await apiClient.get<PublicStaff[]>(
    `/book/${bookingSlug}/staff`,
    {
      params: {
        serviceId,
      },
    }
  );

  return response.data;
}

export async function getAvailableSlots(params: {
  bookingSlug: string;
  staffId: string;
  serviceId: string;
  date: string;
}) {
  const response = await apiClient.get<AvailableSlotsResponse>(
    `/book/${params.bookingSlug}/available-slots`,
    {
      params: {
        staffId: params.staffId,
        serviceId: params.serviceId,
        date: params.date,
      },
    }
  );

  return response.data;
}

export async function createPublicAppointment(
  bookingSlug: string,
  payload: CreatePublicAppointmentPayload
) {
  const response = await apiClient.post<PublicAppointment>(
    `/book/${bookingSlug}/appointments`,
    payload
  );

  return response.data;
}

export async function getPublicAppointmentByReference(params: {
  bookingSlug: string;
  bookingReference: string;
  email: string;
}) {
  const response = await apiClient.get<PublicAppointment>(
    `/book/${params.bookingSlug}/appointments/${params.bookingReference}`,
    {
      params: {
        email: params.email,
      },
    }
  );

  return response.data;
}

export async function cancelPublicAppointment(params: {
  bookingSlug: string;
  bookingReference: string;
  email: string;
}) {
  const response = await apiClient.patch<PublicAppointment>(
    `/book/${params.bookingSlug}/appointments/${params.bookingReference}/cancel`,
    {
      email: params.email,
    }
  );

  return response.data;
}

export async function reschedulePublicAppointment(params: {
  bookingSlug: string;
  bookingReference: string;
  email: string;
  startDateTime: string;
}) {
  const response = await apiClient.patch<PublicAppointment>(
    `/book/${params.bookingSlug}/appointments/${params.bookingReference}/reschedule`,
    {
      email: params.email,
      startDateTime: params.startDateTime,
    }
  );

  return response.data;
}
