// cuando hacemos la query en el service no hace la hidratacion. devuelve lo mismo que la tabla en la DB.
export interface RawOutbox {
  id: string;
  group_id: string;
  payload: any;
  retry_count: number;
  next_attempt_at: Date;
}
