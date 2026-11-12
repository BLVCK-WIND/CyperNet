import { Navigate, useLocation } from 'react-router-dom';
import { customerLoginPath, qrComputerCode } from '@/utils/customerRoute';

export function CustomerLoginRedirect() {
  const { search } = useLocation();
  return <Navigate to={customerLoginPath(qrComputerCode(search))} replace />;
}
