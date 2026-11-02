import { ListMeasurementsQueryDto } from '../../measurements/dto/list-measurements-query.dto';

/**
 * Filtros del listado de alertas. Una alerta es una medición que supera su
 * umbral, por lo que admite exactamente los mismos filtros, paginación y orden
 * que el listado de mediciones.
 */
export class ListAlertsQueryDto extends ListMeasurementsQueryDto {}
