import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useDoctorEvents } from "../realtime/useAppointmentEvents.js";
import { doctorService } from "../services/doctorService.js";
import {
  createDoctor,
  deleteDoctor,
  fetchDoctors,
  selectAllDoctors,
  selectDoctorsStatus,
  updateDoctor,
} from "../store/slices/doctorsSlice.js";
import Layout from "../components/common/Layout.jsx";
import Card from "../components/common/Card.jsx";
import Modal from "../components/common/Modal.jsx";
import DoctorForm from "../components/doctors/DoctorForm.jsx";
import DoctorSchedule from "../components/doctors/DoctorSchedule.jsx";
import Avatar from "../components/common/Avatar.jsx";
import Badge from "../components/common/Badge.jsx";
import Button from "../components/common/Button.jsx";
import toast from "react-hot-toast";
import SearchBar from "../components/common/SearchBar.jsx";

export default function DoctorsPage() {
  const dispatch = useDispatch();
  const doctors = useSelector(selectAllDoctors);
  const status = useSelector(selectDoctorsStatus);
  const loading = status === "loading" || status === "idle";

  useEffect(() => {
    dispatch(fetchDoctors());
  }, [dispatch]);

  // Re-pull the slice whenever any window mutates the doctors collection
  useDoctorEvents(useCallback(() => { dispatch(fetchDoctors()); }, [dispatch]));

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewSchedule, setViewSchedule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingOp, setDeletingOp] = useState(false);

  const filtered =
    doctors?.filter((d) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        `${d.first_name} ${d.last_name}`.toLowerCase().includes(q) ||
        d.phone?.includes(q) ||
        d.specialty?.toLowerCase().includes(q)
      );
    }) ?? [];

  async function handleSave(data) {
    setSaving(true);
    try {
      if (editing?.doctor_id) {
        await dispatch(updateDoctor({ id: editing.doctor_id, dto: data })).unwrap();
        toast.success("Doctor profile updated");
      } else {
        await dispatch(createDoctor(data)).unwrap();
        toast.success("Doctor registered");
      }
      setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeletingOp(true);
    try {
      const appointments = await doctorService.getAppointments(deleting.doctor_id);
      if (appointments && appointments.length > 0) {
        toast.error(
          `Cannot delete — Dr. ${deleting.first_name} ${deleting.last_name} has ${appointments.length} appointment(s) assigned.`
        );
        return;
      }
      await dispatch(deleteDoctor(deleting.doctor_id)).unwrap();
      toast.success("Doctor deleted");
      setDeleting(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete doctor");
    } finally {
      setDeletingOp(false);
    }
  }

  const specialtyColor = (s) => {
    const map = {
      "General Medicine": "blue",
      Cardiology: "red",
      Surgery: "purple",
      Pediatrics: "green",
      Orthopedics: "yellow",
      Neurology: "indigo",
    };
    return map[s] || "gray";
  };

  return (
    <Layout title="Doctors">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, phone, or specialty…"
            className="flex-1 max-w-sm"
          />
          <Button onClick={() => setEditing({})}>+ New Doctor</Button>
        </div>
        <Card>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-28 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : !filtered?.length ? (
            <p className="text-center py-12 text-gray-400">
              {search
                ? "No doctors match your search."
                : "No doctors registered yet."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((doc) => (
                <div
                  key={doc.doctor_id}
                  className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar name={`${doc.first_name} ${doc.last_name}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        Dr. {doc.first_name} {doc.last_name}
                      </p>
                      <Badge color={specialtyColor(doc.specialty)}>
                        {doc.specialty}
                      </Badge>
                    </div>
                  </div>
                  {doc.phone && (
                    <p className="text-xs text-gray-400 mb-3">📞 {doc.phone}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setViewSchedule(doc)}
                    >
                      Schedule
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditing(doc)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleting(doc)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.doctor_id ? "Edit Doctor Profile" : "New Doctor"}
      >
        {editing && (
          <DoctorForm
            initial={editing}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
            loading={saving}
          />
        )}
      </Modal>

      <Modal
        open={Boolean(viewSchedule)}
        onClose={() => setViewSchedule(null)}
        title={
          viewSchedule
            ? `Dr. ${viewSchedule.first_name} ${viewSchedule.last_name} — Upcoming Schedule`
            : ""
        }
        size="lg"
      >
        {viewSchedule && <DoctorSchedule doctorId={viewSchedule.doctor_id} />}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete Doctor"
      >
        {deleting && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                Dr. {deleting.first_name} {deleting.last_name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={deletingOp}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
