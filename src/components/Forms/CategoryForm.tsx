import { useForm } from 'react-hook-form';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Alert from '../UI/Alert';

export interface CategoryFormData {
  name: string;
}

interface CategoryFormProps {
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: { id: string; name: string };
}

export default function CategoryForm({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
}: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormData>({
    defaultValues: {
      name: initialData?.name || '',
    },
  });

  const onSubmitForm = async (data: CategoryFormData) => {
    try {
      await onSubmit(data);
    } catch (err) {
      // Error handling di parent component
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <Input
        label="Nama Kategori *"
        placeholder="Masukkan nama kategori"
        error={errors.name?.message}
        {...register('name', { required: 'Nama kategori wajib diisi' })}
      />

      {/* Buttons */}
      <div className="flex gap-4 mt-6">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          className="flex-1"
        >
          {initialData ? 'Update' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
}

